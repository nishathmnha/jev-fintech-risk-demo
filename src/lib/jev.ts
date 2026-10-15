import { z } from "zod";

export const transactionSchema = z.object({
  amount: z.number().positive().max(10_000_000_000),
  transactionType: z.string().trim().min(1).max(80),
  location: z.string().trim().min(1).max(120),
  newBeneficiary: z.boolean(),
  transactionsLast10Minutes: z.number().int().min(0).max(1000),
  typicalAmount: z.number().positive().max(10_000_000_000),
  newDevice: z.boolean(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type DecisionEvidence = { factor: string; value: string };

type JevChoiceAnswer = { choice: string; probabilities: Record<string, number>; confidence: number };
type JevNoulAnswer = { noul: number };
export type JevResponse = {
  model: string;
  answers: {
    risk_level: JevChoiceAnswer;
    likely_fraud: JevNoulAnswer;
    recommended_action: JevChoiceAnswer;
  };
  usage?: unknown;
};

export type FraudResult = {
  raw: JevResponse;
  processed: {
    riskLevel: string;
    riskConfidence: number;
    fraudProbability: number;
    decision: string;
    decisionConfidence: number;
    signals: string[];
    evidence: DecisionEvidence[];
    inputCoverage: { provided: number; required: number; verification: "unverified" };
  };
};

function formatLkr(value: number): string {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
}

function getSignals(transaction: TransactionInput): string[] {
  const signals: string[] = [];
  if (transaction.newBeneficiary) signals.push("New beneficiary");
  if (transaction.newDevice) signals.push("New device");
  const ratio = transaction.amount / transaction.typicalAmount;
  if (ratio >= 3) signals.push(`Amount is ${ratio.toFixed(1)}× typical`);
  if (transaction.transactionsLast10Minutes >= 3) signals.push(`${transaction.transactionsLast10Minutes} transactions in 10 minutes`);
  return signals;
}

function getEvidence(transaction: TransactionInput): DecisionEvidence[] {
  const ratio = transaction.amount / transaction.typicalAmount;
  return [
    { factor: "Transaction amount", value: formatLkr(transaction.amount) },
    { factor: "Typical amount", value: formatLkr(transaction.typicalAmount) },
    { factor: "Amount vs. typical", value: `${ratio.toFixed(1)}×` },
    { factor: "Transaction type and location", value: `${transaction.transactionType} · ${transaction.location}` },
    { factor: "Beneficiary", value: transaction.newBeneficiary ? "New beneficiary" : "Previously used beneficiary" },
    { factor: "Recent activity", value: `${transaction.transactionsLast10Minutes} transaction(s) in the last 10 minutes` },
    { factor: "Device", value: transaction.newDevice ? "New device" : "Previously used device" },
  ];
}

const jevResponseSchema = z.object({
  model: z.string(),
  answers: z.object({
    risk_level: z.object({ choice: z.string(), probabilities: z.record(z.string(), z.number()), confidence: z.number().min(0).max(1) }),
    likely_fraud: z.object({ noul: z.number().min(0).max(1) }),
    recommended_action: z.object({ choice: z.string(), probabilities: z.record(z.string(), z.number()), confidence: z.number().min(0).max(1) }),
  }),
  usage: z.unknown().optional(),
});

export async function runJevDecision(transaction: TransactionInput): Promise<FraudResult> {
  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) throw new Error("JEV_API_KEY is not configured");

  const payload = {
    model: "jev-latest",
    state: {
      amount_lkr: transaction.amount,
      transaction_type: transaction.transactionType,
      location: transaction.location,
      new_beneficiary: transaction.newBeneficiary,
      transactions_last_10_minutes: transaction.transactionsLast10Minutes,
      typical_transaction_amount_lkr: transaction.typicalAmount,
      new_device: transaction.newDevice,
    },
    questions: {
      risk_level: {
        type: "choice",
        instructions: "Assess the overall fraud risk of this transaction using only the supplied transaction facts. Return low, medium, or high. Treat each indicator as evidence to review, not proof of fraud.",
        criteria: {
          low: "The transaction is broadly consistent with the supplied account pattern and has few unusual indicators.",
          medium: "One or more unusual indicators warrant additional verification before proceeding.",
          high: "Several strong unusual indicators occur together and warrant urgent review.",
        },
      },
      likely_fraud: {
        type: "noul",
        instructions: "Estimate the probability that this transaction is fraudulent based only on the supplied facts. Return a number from 0 to 1. This is a model estimate, not a calibrated real-world fraud rate and not proof of fraud.",
      },
      recommended_action: {
        type: "choice",
        instructions: "Choose the safest immediate demo action. Use step_up_auth for limited suspicious evidence, manual_review when several indicators need investigation, and block only for a strong combination of indicators. Do not claim fraud is confirmed. No real payment will be affected.",
        criteria: {
          allow: "Allow the demo transaction to proceed when it appears consistent with the supplied pattern.",
          step_up_auth: "Request additional customer authentication before proceeding.",
          manual_review: "Hold the demo transaction for a human fraud analyst to review.",
          block: "Recommend blocking this demo transaction because several strong indicators coincide; this remains a model recommendation, not a real payment action.",
        },
      },
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Jev took too long to respond. Please try again.");
    throw new Error("Could not connect to Jev. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Jev API returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const parsed = jevResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Jev returned a response in an unexpected format.");
  const raw = parsed.data;
  const requiredInputs = Object.keys(transactionSchema.shape) as (keyof TransactionInput)[];
  const providedInputs = requiredInputs.filter((key) => Object.prototype.hasOwnProperty.call(transaction, key) && transaction[key] !== undefined).length;

  return {
    raw,
    processed: {
      riskLevel: raw.answers.risk_level.choice,
      riskConfidence: raw.answers.risk_level.confidence,
      fraudProbability: raw.answers.likely_fraud.noul,
      decision: raw.answers.recommended_action.choice,
      decisionConfidence: raw.answers.recommended_action.confidence,
      signals: getSignals(transaction),
      evidence: getEvidence(transaction),
      inputCoverage: { provided: providedInputs, required: requiredInputs.length, verification: "unverified" },
    },
  };
}
import { z } from "zod";

export const DEMO_APR = 0.18;

export const loanApplicationSchema = z.object({
  monthlyIncome: z.number().positive().max(1_000_000_000),
  existingMonthlyDebt: z.number().min(0).max(1_000_000_000),
  requestedAmount: z.number().positive().max(10_000_000_000),
  termMonths: z.number().int().min(3).max(360),
  employmentMonths: z.number().int().min(0).max(1200),
  incomeType: z.enum(["salaried", "self_employed"]),
  repaymentHistory: z.enum(["clean", "one_late_payment", "multiple_late_payments", "limited_history"]),
});

export type LoanApplication = z.infer<typeof loanApplicationSchema>;
export type DecisionEvidence = { factor: string; value: string };

type JevChoiceAnswer = {
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};
type JevNoulAnswer = { noul: number };
export type JevResponse = {
  model: string;
  answers: {
    eligibility_decision: JevChoiceAnswer;
    repayment_risk: JevNoulAnswer;
    recommended_next_step: JevChoiceAnswer;
  };
  usage?: unknown;
};

export type LoanResult = {
  raw: JevResponse;
  processed: {
    eligibility: string;
    confidence: number;
    repaymentRisk: number;
    nextStep: string;
    nextStepConfidence: number;
    estimatedMonthlyPayment: number;
    estimatedMonthlyCommitments: number;
    commitmentsToIncomeRatio: number;
    demoApr: number;
    evidence: DecisionEvidence[];
  };
};

export function estimateMonthlyPayment(principal: number, termMonths: number): number {
  const monthlyRate = DEMO_APR / 12;
  const factor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return principal * factor;
}

function formatLkr(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getEvidence(application: LoanApplication, payment: number, passesDemoScreen: boolean): DecisionEvidence[] {
  const monthlyCommitments = application.existingMonthlyDebt + payment;
  const commitmentsRatio = monthlyCommitments / application.monthlyIncome;
  const historyLabels: Record<LoanApplication["repaymentHistory"], string> = {
    clean: "No recent missed payments reported",
    one_late_payment: "One recent late payment reported",
    multiple_late_payments: "Multiple recent late payments reported",
    limited_history: "Limited repayment history reported",
  };

  return [
    { factor: "Gross monthly income", value: formatLkr(application.monthlyIncome) },
    { factor: "Requested loan", value: `${formatLkr(application.requestedAmount)} over ${application.termMonths} months` },
    { factor: "Estimated monthly installment", value: `${formatLkr(payment)} at illustrative ${Math.round(DEMO_APR * 100)}% APR` },
    { factor: "Existing monthly debt", value: formatLkr(application.existingMonthlyDebt) },
    { factor: "Estimated total monthly commitments", value: `${formatLkr(monthlyCommitments)} · ${Math.round(commitmentsRatio * 100)}% of gross monthly income` },
    { factor: "Employment / income type", value: `${application.employmentMonths} months · ${application.incomeType === "salaried" ? "Salaried" : "Self-employed"}` },
    { factor: "Reported repayment history", value: historyLabels[application.repaymentHistory] },
    { factor: "Illustrative demo screen", value: passesDemoScreen ? "Passes all demo checks" : "One or more demo checks require manual review" },
  ];
}

const jevResponseSchema = z.object({
  model: z.string(),
  answers: z.object({
    eligibility_decision: z.object({
      choice: z.string(),
      probabilities: z.record(z.string(), z.number()),
      confidence: z.number().min(0).max(1),
    }),
    repayment_risk: z.object({ noul: z.number().min(0).max(1) }),
    recommended_next_step: z.object({
      choice: z.string(),
      probabilities: z.record(z.string(), z.number()),
      confidence: z.number().min(0).max(1),
    }),
  }),
  usage: z.unknown().optional(),
});

export async function runJevDecision(application: LoanApplication): Promise<LoanResult> {
  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) throw new Error("JEV_API_KEY is not configured");

  const monthlyPayment = estimateMonthlyPayment(application.requestedAmount, application.termMonths);
  const monthlyCommitments = application.existingMonthlyDebt + monthlyPayment;
  const commitmentsRatio = monthlyCommitments / application.monthlyIncome;
  const passesDemoScreen = commitmentsRatio <= 0.35 && application.employmentMonths >= 12 && application.incomeType === "salaried" && application.repaymentHistory === "clean";
  const evidence = getEvidence(application, monthlyPayment, passesDemoScreen);
  const payload = {
    model: "jev-latest",
    state: {
      currency: "LKR",
      monthly_gross_income_lkr: application.monthlyIncome,
      existing_monthly_debt_payments_lkr: application.existingMonthlyDebt,
      requested_loan_amount_lkr: application.requestedAmount,
      requested_term_months: application.termMonths,
      estimated_monthly_loan_payment_lkr: monthlyPayment,
      estimated_monthly_debt_commitments_lkr: monthlyCommitments,
      estimated_commitments_to_income_ratio: commitmentsRatio,
      payment_estimate_annual_rate: DEMO_APR,
      payment_estimate_is_illustrative: true,
      demo_screen_passed: passesDemoScreen,
      demo_screen_rule: "Approved only when estimated monthly commitments are at most 35% of gross income, employment duration is at least 12 months, income is salaried, and reported repayment history is clean. Otherwise Manual review.",
      employment_months: application.employmentMonths,
      income_type: application.incomeType,
      repayment_history: application.repaymentHistory,
      decision_context: "Synthetic portfolio demo only. Do not make or communicate a real credit decision.",
    },
    questions: {
      eligibility_decision: {
        type: "choice",
        instructions: "Return exactly one of two synthetic demo outcomes: approved or manual_review. Follow the supplied demo_screen_passed value. Return approved only when it is true: estimated monthly debt commitments are no more than 35% of gross income, employment duration is at least 12 months, income is salaried, and reported repayment history is clean. Return manual_review for every other case, including missing, uncertain, or borderline information. These are fictional demo rules, not lender standards or a real credit decision. Do not use protected characteristics or unrelated personal traits. Treat the listed evidence as facts, not proof that any one factor caused the outcome.",
        criteria: {
          approved: "The supplied demo_screen_passed value is true and all four fictional screening checks pass. This is only a demo outcome, not an approval, offer, or authorization to lend.",
          manual_review: "At least one fictional screening check does not pass or information needs verification; route the case to a human reviewer. Use this outcome whenever unsure.",
        },
      },
      repayment_risk: {
        type: "noul",
        instructions: "Estimate a demo-only probability that repayment capacity may be a concern based only on the supplied synthetic financial and repayment-history information. Return a number from 0 to 1. This is not a validated default probability.",
      },
      recommended_next_step: {
        type: "choice",
        instructions: "Recommend a safe next step for this demo application. Never present the result as a binding approval or denial.",
        criteria: {
          verify_income: "Ask a human reviewer to verify income and existing obligations.",
          request_more_information: "Request missing or longer-term income and repayment information.",
          human_review: "Route the case to a qualified human reviewer.",
          reassess_loan_terms: "Invite the applicant to discuss a lower requested amount or a different term with a human; do not promise eligibility.",
          continue_demo_review: "Continue to a human review stage; this is not final loan approval.",
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
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Jev took too long to respond. Please try again.");
    }
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
  return {
    raw,
    processed: {
      eligibility: raw.answers.eligibility_decision.choice,
      confidence: raw.answers.eligibility_decision.confidence,
      repaymentRisk: raw.answers.repayment_risk.noul,
      nextStep: raw.answers.recommended_next_step.choice,
      nextStepConfidence: raw.answers.recommended_next_step.confidence,
      estimatedMonthlyPayment: monthlyPayment,
      estimatedMonthlyCommitments: monthlyCommitments,
      commitmentsToIncomeRatio: commitmentsRatio,
      demoApr: DEMO_APR,
      evidence,
    },
  };
}
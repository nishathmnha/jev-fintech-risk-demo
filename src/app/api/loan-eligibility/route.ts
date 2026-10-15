import { NextResponse } from "next/server";
import { loanApplicationSchema, runJevDecision } from "@/lib/jev";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = loanApplicationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Check the loan application details and try again.", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await runJevDecision(validation.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to assess this demo application.";
    const status = message === "JEV_API_KEY is not configured" ? 503 : 502;
    console.error("Loan eligibility demo evaluation failed:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
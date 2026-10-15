# Jev Loan Eligibility Demo

A small Next.js portfolio demo that sends synthetic loan application details to Jev and shows both its raw response and a processed assessment. It is not a real lending or underwriting system. No approval, denial, or loan offer is issued.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set your server-side `JEV_API_KEY`.
3. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The API key is only read by the server route. Do not add a `NEXT_PUBLIC_` prefix. `.env` and `.env.local` are ignored by Git.

## Demo flow

The application form posts to `POST /api/loan-eligibility`. The route validates input with Zod, estimates a monthly payment using an illustrative fixed 18% annual rate, and sends the inputs and estimate to `https://api.typesafe.ai/v1/systemone`. The demo returns an Approved or Manual review outcome and includes Jev's raw answers, estimated payment, commitments-to-income ratio, and a structured list of the application inputs considered as evidence. The evidence records submitted values and calculations; it does not claim that a factor caused the outcome.

Four synthetic scenarios are available in the UI: comfortable repayment, high existing debt, limited repayment history, and variable income. These are examples for exploring the interface, not validated lending criteria. The rate and results are illustrative; real underwriting requires an institution's validated policy, verified information, fair-lending review, and human oversight.

## Fictional demo screen

The sample **Approved** outcome requires all four illustrative checks: estimated monthly debt commitments at or below 35% of gross income, at least 12 months in current employment, salaried income, and clean reported repayment history. Other cases return **Manual review**. These are made-up demo rules for predictable examples, not validated lending criteria.

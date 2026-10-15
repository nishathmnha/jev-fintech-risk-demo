# Jev Transaction Fraud Demo

A small Next.js portfolio demo that sends synthetic transaction details to Jev and shows its raw typed response, fraud likelihood, risk level, recommended action, and the input evidence considered. It does not connect to a payment system or confirm fraud.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set your server-side `JEV_API_KEY`.
3. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The API key is only read by the server route. Do not add a `NEXT_PUBLIC_` prefix. `.env` and `.env.local` are ignored by Git.

## Demo flow

The form posts to `POST /api/transaction-risk`. The route validates input with Zod, calls `https://api.typesafe.ai/v1/systemone`, and returns raw Jev answers plus a processed view. The UI includes four synthetic examples, an estimated fraud likelihood, a risk level, recommended action, confidence context, and transaction evidence. Actions are demonstrations only; no real transaction is allowed, held, or blocked.
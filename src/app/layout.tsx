import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev Eligibility Lab | Loan Decision Demo",
  description: "Explore illustrative loan application indicators and typed Jev decisions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
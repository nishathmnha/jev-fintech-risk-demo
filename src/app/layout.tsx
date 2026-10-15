import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev Fraud Lab | Transaction Risk Demo",
  description: "Explore transaction fraud signals and typed Jev decisions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jev Fintech Risk Demo",
  description: "A fintech risk demonstration app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

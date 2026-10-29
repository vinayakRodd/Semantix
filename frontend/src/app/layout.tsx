import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semantix - LLM Dialogue & Synthesis Matrix",
  description: "Inspect, compress, verify, and synthesize shared LLM conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}

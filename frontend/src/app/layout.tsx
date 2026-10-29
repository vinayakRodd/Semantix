import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meghu LLM Chat Viewer",
  description: "View and format shared LLM conversations seamlessly",
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

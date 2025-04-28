import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Simple Jira",
  description: "A Simple Jira Ticket Editor Application",
  icons: {
    icon: "/favicon.png"
  }
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

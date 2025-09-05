import type { Metadata } from "next";
import "./globals.scss";


// Set the favicon
export const metadata: Metadata = {
  title: "Ticket Mirror",
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

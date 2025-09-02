import type { Metadata } from "next";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "DuoFinder",
  description: "Tu dúo a un click",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { brandVars } from "@socialize/panel-kit/brand";
import { Panel } from "./panel";
import "./globals.css";

export const metadata: Metadata = { title: "Panel kit fixture" };

// The brand arrives inline on <html> from brandVars — Señorritas' crimson
// here, so the build proves a client's colour, not only the house lime.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="kit" style={brandVars("#80001E")}>
      <body>
        <Panel>{children}</Panel>
      </body>
    </html>
  );
}

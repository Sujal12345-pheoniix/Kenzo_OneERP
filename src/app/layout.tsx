import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kenzo OneERP | AI-Powered Enterprise Resource Planning",
  description:
    "Flagship multi-tenant SaaS ERP platform by Kenzo Infosystems. Cloud Operations, HRMS, CRM, Finance, and AI Copilot.",
};

// This script runs before React hydration to prevent FOUC (Flash of Unstyled Content)
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('kenzo_theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Inline theme init script — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Kenzo Digital Adoption Platform Snippet */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://kenzo-dap.onrender.com/sdk.js" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var checkKenzo = setInterval(function() {
              if (typeof Kenzo !== 'undefined') {
                clearInterval(checkKenzo);
                Kenzo.init({
                  apiKey: "kenzo_project_1785139787760_key_u1yaq",
                  apiBaseUrl: "https://kenzo-dap.onrender.com/api/v1"
                }).then(function() {
                  console.log("[KenzoDAP] Successfully initialized with project key kenzo_project_1785139787760_key_u1yaq");
                }).catch(function(err) {
                  console.warn("[KenzoDAP] Initialization notice:", err);
                });
              }
            }, 50);
          })();
        ` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}

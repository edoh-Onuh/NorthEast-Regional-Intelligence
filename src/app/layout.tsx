import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Live economic, labour market, skills, population, housing, health and crime intelligence for North East England's seven local authorities, sourced from ONS, NOMIS and other UK government open data.";

export const metadata: Metadata = {
  title: {
    default: "North East Regional Intelligence",
    template: "%s · North East Regional Intelligence",
  },
  description: SITE_DESCRIPTION,
  applicationName: "North East Regional Intelligence",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  keywords: [
    "North East England",
    "regional intelligence",
    "open data",
    "ONS",
    "NOMIS",
    "local authority statistics",
    "GVA",
    "labour market",
    "house prices",
    "life expectancy",
    "Newcastle",
    "Gateshead",
    "Sunderland",
    "County Durham",
    "Northumberland",
  ],
  authors: [{ name: "North East Regional Intelligence" }],
  category: "government",
  openGraph: {
    title: "North East Regional Intelligence",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en_GB",
    siteName: "North East Regional Intelligence",
  },
  twitter: {
    card: "summary_large_image",
    title: "North East Regional Intelligence",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/**
 * Schema.org structured data (Dataset + WebSite) so search engines and AI
 * crawlers understand what this page is and where its data comes from.
 * Rendered as an inert `application/ld+json` block — not executed JS, so it is
 * unaffected by the strict `script-src 'self'` CSP; the `<` escape follows
 * Next.js's JSON-LD guidance to neutralise any stray markup.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "North East Regional Intelligence",
  description: SITE_DESCRIPTION,
  license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
  creator: {
    "@type": "Organization",
    name: "North East Regional Intelligence",
  },
  isBasedOn: [
    "https://www.nomisweb.co.uk/",
    "https://www.ons.gov.uk/",
    "https://landregistry.data.gov.uk/",
    "https://fingertips.phe.org.uk/",
  ],
  spatialCoverage: {
    "@type": "Place",
    name: "North East England",
  },
  keywords: [
    "economy",
    "labour market",
    "skills",
    "population",
    "housing",
    "health",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

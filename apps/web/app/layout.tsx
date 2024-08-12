import "../styles/globals.css";
import "../styles/prosemirror.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "../components/theme-provider";
import Providers from "./providers";

const title = "Louis 的文章編輯";
const description = "讓文章像用Notion一樣好寫";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL("https://example.com"), // Replace with your actual domain
  openGraph: {
    title,
    description,
    images: ["/path/to/og-image.jpg"], // Add an Open Graph image
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/path/to/twitter-image.jpg"], // Add a Twitter image
    site: "@your_twitter_handle", // Add your Twitter handle here
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <main className="flex-1 transition-all duration-300 ease-in-out">{children}</main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

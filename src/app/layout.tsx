import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cameronfoxly.github.io/patch-studio"),
  title: "Patch Studio for @web-kits/audio",
  description: "Visual patch design studio for the @web-kits/audio library. Build multi-layer synthesized sounds with a DAW-style interface.",
  icons: {
    icon: [
      { url: `${basePath}/favicon.svg`, type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Patch Studio",
    description: "Visual sound design for @web-kits/audio. Build multi-layer synthesized sounds with a DAW-style interface.",
    url: "https://cameronfoxly.github.io/patch-studio/",
    siteName: "Patch Studio",
    images: [
      {
        url: `${basePath}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Patch Studio — a visual sound design GUI with timeline, waveform layers, and parameter controls",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patch Studio",
    description: "Visual sound design for @web-kits/audio. Build multi-layer synthesized sounds with a DAW-style interface.",
    images: [`${basePath}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            if (t === 'light') document.documentElement.classList.remove('dark');
          } catch(e) {}
        ` }} />
      </head>
      <body className="min-h-full flex flex-col md:overflow-hidden">{children}</body>
    </html>
  );
}

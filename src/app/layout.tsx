import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patch Studio for @web-kits/audio",
  description: "Visual patch design studio for the @web-kits/audio library. Build multi-layer synthesized sounds with a DAW-style interface.",
  icons: {
    icon: [
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`, type: "image/svg+xml" },
    ],
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
      <body className="min-h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "@fontsource-variable/baloo-2";
import "@fontsource-variable/nunito-sans";
import "@fontsource/lora/400-italic.css";
import "@fontsource/lora/500-italic.css";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { CartDrawer } from "@/components/cart-ui";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  icons: {
    icon: [{ url: "/brand/favicon-32.png", sizes: "32x32" }, { url: "/brand/icon-192.png", sizes: "192x192" }],
    apple: "/brand/icon-192.png",
  },
  openGraph: {
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    images: [{ url: "/brand/logo_full.png", width: 989, height: 816, alt: SITE.name }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f9f3e3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="paper-grain flex min-h-full flex-col">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sage-700 focus:px-4 focus:py-2 focus:text-cream-50"
          >
            Skip to content
          </a>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

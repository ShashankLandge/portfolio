import type { Metadata, Viewport } from "next";
import { Frame } from "@/components/frame";
import { SceneCanvas } from "@/components/scene-canvas";
import { ViewsStack } from "@/components/views/views-stack";
import { SceneColorProvider } from "@/components/scene-color-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shashank Landge",
  description:
    "Shashank Landge — engineer pursuing clarity through algorithms, code and simplicity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

type RootLayoutProps = { children: React.ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-black text-white">
        <SceneColorProvider>
          <SceneCanvas />
          <Frame>
            <ViewsStack />
          </Frame>
          {children}
        </SceneColorProvider>
      </body>
    </html>
  );
}

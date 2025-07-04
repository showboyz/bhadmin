import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout-wrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brain Health Admin Console",
  description: "시니어 인지 및 운동 훈련 프로그램 관리 시스템 - Brain Health Playground",
  icons: {
    icon: "https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

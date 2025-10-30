import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { AuthProvider } from "@/contexts/SupabaseAuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/monitoring/ErrorTracker";
import { AnalyticsProvider } from "@/components/monitoring/AnalyticsProvider";
import { PerformanceTracker } from "@/components/monitoring/ErrorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Oris - Assessment & Task Management Platform",
    template: "%s | Oris"
  },
  description: "Professional assessment and task management platform for students and educators. Track progress, manage tasks, and achieve academic excellence.",
  keywords: ["assessment", "task management", "education", "student", "progress tracking", "academic", "planner"],
  authors: [{ name: "Oris Team" }],
  creator: "Oris",
  publisher: "Oris",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://oris.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://oris.vercel.app',
    title: 'Oris - Assessment & Task Management Platform',
    description: 'Professional assessment and task management platform for students and educators.',
    siteName: 'Oris',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Oris - Assessment & Task Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oris - Assessment & Task Management Platform',
    description: 'Professional assessment and task management platform for students and educators.',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Add your Google verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AnalyticsProvider>
            <PerformanceTracker />
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Navigation />
                {children}
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

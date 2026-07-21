import type { Metadata } from 'next';
import { Poppins, Fira_Code } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './global.css';

const poppins = Poppins({
  variable: '--font-poppins-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sparkle - Take control of your PC',
  description: 'A Windows app to debloat and optimize your PC',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${firaCode.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider>{children}</RootProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

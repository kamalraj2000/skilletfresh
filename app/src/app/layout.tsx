import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Instrument_Sans } from 'next/font/google';
import { AppStateProvider } from '@/lib/app-state';
import './globals.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
});

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-atkinson',
});

export const metadata: Metadata = {
  title: 'SkilletFresh',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#EFEAE0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${atkinsonHyperlegible.variable}`}>
      <body>
        <AppStateProvider>
          <div className="app-frame">{children}</div>
        </AppStateProvider>
      </body>
    </html>
  );
}

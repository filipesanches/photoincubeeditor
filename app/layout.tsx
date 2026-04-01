import type {Metadata} from 'next';
import { Inter, Dancing_Script } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-cursive' });

export const metadata: Metadata = {
  title: 'Polaroid Studio',
  description: 'Crie e salve suas fotos no formato Polaroid em PDF',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.className} ${dancingScript.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

import type {Metadata} from 'next';
import { 
  Inter, 
  Dancing_Script, 
  Caveat, 
  Pacifico, 
  Roboto_Mono, 
  Playfair_Display, 
  Montserrat 
} from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-cursive' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });
const pacifico = Pacifico({ weight: '400', subsets: ['latin'], variable: '--font-pacifico' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-mono' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: 'Photo in Cube',
  description: 'Crie e salve suas fotos no formato Polaroid em PDF',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`
      ${inter.variable} 
      ${dancingScript.variable} 
      ${caveat.variable} 
      ${pacifico.variable} 
      ${robotoMono.variable} 
      ${playfair.variable} 
      ${montserrat.variable}
    `}>
      <body suppressHydrationWarning className={inter.className}>{children}</body>
    </html>
  );
}

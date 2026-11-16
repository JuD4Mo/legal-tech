import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import './globals.css';
export const metadata: Metadata = {
  title: 'Legal Special One | Gestión jurídica',
  description: 'La gestión jurídica, en un solo lugar. Demostración frontend con datos ficticios.',
  icons: { icon: '/icon-lso.png' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}

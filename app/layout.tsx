import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MRA — My Rights App | Pakistan',
  description:
    'Free legal information for Pakistani citizens in Urdu and English — MRA My Rights App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

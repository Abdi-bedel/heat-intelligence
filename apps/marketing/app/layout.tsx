import type { Metadata } from 'next';
import './globals.css';
import { ThemeToggle } from './components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Heat Intelligence — Your till tells you what happened inside.',
  description:
    "Live where Barcelona's going out tonight. Comparison data on how your venue stacks up. €49 a month, locked forever for the first 50 venues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const key = 'heat-theme';
                const stored = localStorage.getItem(key);
                const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                document.documentElement.dataset.theme = theme;
              } catch {}
            })();`,
          }}
        />
      </head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}

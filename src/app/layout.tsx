import type { Metadata } from 'next';
import './globals.css';
import { Prompt } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';

const prompt = Prompt({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
});

export const metadata: Metadata = {
  title: 'ระบบเช็คชื่อ วิทยาลัยชุมชนสมุทรสาคร',
  description: 'Smart attendance checking for ICCS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={prompt.className}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="main-content" style={{ flex: 1 }}>
              {children}
            </main>
            <footer style={{ 
              textAlign: 'center', 
              padding: '2rem 1rem 1rem 1rem', 
              color: '#9ca3af', 
              fontSize: '0.85rem',
              marginTop: 'auto'
            }}>
              <p style={{ margin: 0 }}>พัฒนาโดย งานเทคโนโลยีสารสนเทศ วิทยาลัยชุมชนสมุทรสาคร</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

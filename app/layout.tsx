import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SITE_URL } from '@/lib/site';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: '紫微斗数 · 一生寥落动幽情',
  description: '基于倪海厦《天纪》正宗紫微斗数体系，提供完整排盘推演、三方四正、四化飞星、古籍格局识别、双人合盘与古籍检索。',
  keywords: '紫微斗数, 倪海厦, 紫微斗数全集, 紫微斗数全书, 骨髓赋, 命盘, 14主星, 12宫位',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '紫微斗数 · 一生寥落动幽情',
    description: '基于倪海厦《天纪》正宗紫微斗数体系，提供完整排盘推演、格局识别、双人合盘与古籍原典检索。',
    url: SITE_URL,
    siteName: '紫微斗数',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontUrl = `${BASE_PATH}/fonts/HuiwenMingchao.woff2`;
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href={fontUrl}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'HuiwenMingchao'; src: url('${fontUrl}') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }` }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

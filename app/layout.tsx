import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://exifilixir.web.app';
const siteName = 'EXIFilixir';
const title = 'EXIFilixir – Fix Facebook 360° EXIF for DJI panoramas';
const description =
  'Fix 360° panorama photos (DJI drone panos) so Facebook recognizes them as 360°: enforce 2:1 equirectangular output and inject Photo Sphere (XMP-GPano) metadata.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: siteName,
  alternates: {
    canonical: '/',
  },
  keywords: [
    'facebook 360 photo',
    'dji panorama',
    '360 panorama',
    'equirectangular',
    'photo sphere',
    'xmp gpano',
    'exif fixer',
    'exif metadata',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title,
    description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteName} — Fix Facebook 360° EXIF for DJI panoramas`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1890ff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Use existing assets to avoid 404s in dev/prod */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/exifilixir.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Datatype:wght@300;400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: siteName,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              description,
              url: siteUrl,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}

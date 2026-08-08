'use client';

import dynamic from 'next/dynamic';
import '@jeffgo10/panorama-viewer/styles.css';

const PanoramaViewer = dynamic(
  () => import('@jeffgo10/panorama-viewer').then((m) => m.PanoramaViewer),
  { ssr: false },
);

type PanoramaPreviewProps = {
  imageUrl: string;
};

export default function PanoramaPreview({ imageUrl }: PanoramaPreviewProps) {
  return <PanoramaViewer imageUrl={imageUrl} mode="view" />;
}

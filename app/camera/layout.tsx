import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KapadMitra Camera',
  description: 'Wireless camera device for KapadMitra store management',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black min-h-screen">
      {children}
    </div>
  );
}

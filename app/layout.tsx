import './globals.css';

export const metadata = {
  title: '排班換班助手 — 各行業通用',
  description: '餐飲/零售/醫療/物流/客服/健身房 通用排班換班 SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f766e',
};

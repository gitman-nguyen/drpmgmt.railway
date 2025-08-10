# ==============================================================================
# FILE: apps/frontend/app/layout.tsx
# (Tạo file này trong thư mục: dr-drill-app/apps/frontend/app/layout.tsx)
# ==============================================================================
import './globals.css';
// import { AuthProvider } from '@/context/AuthContext'; // Tạm thời comment lại để tránh lỗi
// import AppLayout from '@/components/AppLayout'; // Tạm thời comment lại

export const metadata = {
  title: 'DR Drill Platform',
  description: 'Manage and execute Disaster Recovery drills',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider> */}
        {/* Tạm thời hiển thị children trực tiếp */}
        {children}
      </body>
    </html>
  );
}

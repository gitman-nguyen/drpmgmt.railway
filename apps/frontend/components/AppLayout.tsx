# ==============================================================================
# FILE: apps/frontend/components/AppLayout.tsx
# (Tạo file này trong thư mục: dr-drill-app/apps/frontend/components/AppLayout.tsx)
# ==============================================================================
'use client';

// import { useAuth } from '@/context/AuthContext'; // Tạm thời comment
import AdminLayout from './AdminLayout';
import UserLayout from './UserLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // const { user, loading } = useAuth(); // Tạm thời comment
  
  // Giả lập user để hiển thị layout
  const user = { role: 'Admin' }; // Thay đổi 'Admin' thành 'User' để xem layout khác
  const loading = false;

  if (loading) {
    return <div>Loading...</div>;
  }

  // if (!user) {
  //   return <>{children}</>;
  // }

  if (user.role === 'Admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <UserLayout>{children}</UserLayout>;
}

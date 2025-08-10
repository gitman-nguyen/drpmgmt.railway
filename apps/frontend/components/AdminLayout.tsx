# ==============================================================================
# FILE: apps/frontend/components/AdminLayout.tsx
# (Tạo file này trong thư mục: dr-drill-app/apps/frontend/components/AdminLayout.tsx)
# ==============================================================================
'use client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <nav className="w-64 bg-white p-4 shadow-lg">
        Admin Sidebar
      </nav>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

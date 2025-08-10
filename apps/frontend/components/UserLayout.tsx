# ==============================================================================
# FILE: apps/frontend/components/UserLayout.tsx
# (Tạo file này trong thư mục: dr-drill-app/apps/frontend/components/UserLayout.tsx)
# ==============================================================================
'use client';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="bg-white p-4 shadow">
        User Header
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}

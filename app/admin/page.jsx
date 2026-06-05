'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/views/AdminDashboard';

export default function AdminPage() {
  const { user, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !user) router.replace('/admin/login');
  }, [authChecked, user, router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <AdminDashboard user={user} />;
}

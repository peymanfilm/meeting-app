import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CorrespondencePage from '@/pages/CorrespondencePage';
import MeetingsPage from '@/pages/MeetingsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ReportsPage from '@/pages/ReportsPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminScoringPage from '@/pages/admin/AdminScoringPage';
import AdminAlertsPage from '@/pages/admin/AdminAlertsPage';
import AdminPeriodsPage from '@/pages/admin/AdminPeriodsPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import { useAuthStore } from '@/stores/authStore';
import { syncAlerts } from '@/utils/alerts';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';

function AlertSyncer() {
  const user = useAuthStore((s) => s.user);
  const items = useCorrespondenceStore((s) => s.items);
  // Stable signature: only re-run when statuses actually change (avoids render loops)
  const statusSignature = items.map((i) => `${i.id}:${i.status}:${i.deadline}`).join('|');

  useEffect(() => {
    if (user) {
      useCorrespondenceStore.getState().refreshStatuses();
      syncAlerts();
    }
  }, [user, statusSignature]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AlertSyncer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="correspondence" element={<CorrespondencePage />} />
          <Route
            path="decisions"
            element={
              <CorrespondencePage
                defaultType="decision"
                defaultTypes={['decision']}
                title="مدیریت مصوبات"
              />
            }
          />
          <Route
            path="orders"
            element={
              <CorrespondencePage
                defaultType="verbal_order"
                defaultTypes={['verbal_order', 'directive']}
                title="دستورات شفاهی و ابلاغیه‌ها"
              />
            }
          />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin-only panel */}
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="scoring" element={<AdminScoringPage />} />
            <Route path="alerts" element={<AdminAlertsPage />} />
            <Route path="periods" element={<AdminPeriodsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          {/* Legacy alias: settings redirects to admin panel */}
          <Route path="settings" element={<Navigate to="/admin/users" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

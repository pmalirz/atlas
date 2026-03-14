import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthProvider, ProtectedRoute, TenantProvider, RbacProvider } from '@/auth';

// Lazy load components for code splitting
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const DynamicBrowsePage = React.lazy(() => import('@/pages/DynamicBrowsePage').then(module => ({ default: module.DynamicBrowsePage })));
const DynamicCreatePage = React.lazy(() => import('@/pages/DynamicCreatePage').then(module => ({ default: module.DynamicCreatePage })));
const DynamicDetailPage = React.lazy(() => import('@/pages/DynamicDetailPage').then(module => ({ default: module.DynamicDetailPage })));
const LoginPage = React.lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('@/pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = React.lazy(() => import('@/pages/VerifyEmailPage').then(module => ({ default: module.VerifyEmailPage })));

const SuspenseFallback = () => (
    <div className="p-6">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Root redirect - default tenant */}
                <Route path="/" element={<Navigate to="/myatlas" replace />} />

                {/* All tenant-scoped routes under /:slug */}
                <Route path="/:slug/*" element={
                    <TenantProvider>
                        <AuthProvider>
                            <TenantRoutes />
                        </AuthProvider>
                    </TenantProvider>
                } />
            </Routes>
        </BrowserRouter>
    );
}

/**
 * TenantRoutes - All routes scoped to a tenant slug.
 * Renders inside TenantProvider which syncs the slug with ApiClient.
 */
function TenantRoutes() {
    return (
        <Routes>
            {/* Public route - Login */}
            <Route
                path="/login"
                element={
                    <Suspense fallback={<SuspenseFallback />}>
                        <LoginPage />
                    </Suspense>
                }
            />

            {/* Public route - Forgot Password */}
            <Route
                path="/forgot-password"
                element={
                    <Suspense fallback={<SuspenseFallback />}>
                        <ForgotPasswordPage />
                    </Suspense>
                }
            />

            {/* Public route - Reset Password */}
            <Route
                path="/reset-password"
                element={
                    <Suspense fallback={<SuspenseFallback />}>
                        <ResetPasswordPage />
                    </Suspense>
                }
            />

            {/* Public route - Verify Email */}
            <Route
                path="/verify-email"
                element={
                    <Suspense fallback={<SuspenseFallback />}>
                        <VerifyEmailPage />
                    </Suspense>
                }
            />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute><RbacProvider><AppLayout /></RbacProvider></ProtectedRoute>}>
                <Route
                    index
                    element={
                        <Suspense fallback={<SuspenseFallback />}>
                            <DashboardPage />
                        </Suspense>
                    }
                />

                {/* Dynamic entity routes */}
                <Route
                    path="/:entityType"
                    element={
                        <Suspense fallback={<SuspenseFallback />}>
                            <DynamicBrowsePageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/:entityType/create"
                    element={
                        <Suspense fallback={<SuspenseFallback />}>
                            <DynamicCreatePageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/:entityType/:entityId"
                    element={
                        <Suspense fallback={<SuspenseFallback />}>
                            <DynamicDetailPageWrapper />
                        </Suspense>
                    }
                />
            </Route>
        </Routes>
    );
}

// Wrapper components to extract route params
function DynamicBrowsePageWrapper() {
    const { entityType } = useParams();
    return <DynamicBrowsePage entityType={entityType || 'application'} />;
}

function DynamicCreatePageWrapper() {
    const { entityType } = useParams();
    return <DynamicCreatePage entityType={entityType || 'application'} />;
}

function DynamicDetailPageWrapper() {
    const { entityType, entityId } = useParams();
    return <DynamicDetailPage entityType={entityType || 'application'} entityId={entityId || ''} />;
}

export default App;

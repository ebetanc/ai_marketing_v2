import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider, ProtectedLayout } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import { publicRoutes, protectedRoutes } from "@/app/routes/config";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

function App() {
  return (
    <Router>
      <ToastProvider allowActions={false} maxVisible={3} dedupeWindowMs={3000}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary
      resetKeys={[location.key]}
      fallback={({ error, reset }) => (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-gray-50 text-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              App Error
            </h1>
            <p className="text-sm text-gray-600 max-w-md break-words">
              {error.message}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-medium hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Reload
            </button>
          </div>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-gray-600">
            Loading…
          </div>
        }
      >
        <Routes>
          {publicRoutes.map((r) => {
            const C = r.component;
            return <Route key={r.path} path={r.path} element={<C />} />;
          })}
          <Route element={<ProtectedLayout />}>
            <Route element={<Layout />}>
              {protectedRoutes.map((r) => {
                const C = r.component;
                return <Route key={r.path} path={r.path} element={<C />} />;
              })}
              <Route path="/" element={<RootRedirector />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function RootRedirector() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirectTo");
  if (redirectTo) {
    // Redirect to provided path (sanitized: basic allowlisting could be added)
    return <Navigate to={redirectTo} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default App;

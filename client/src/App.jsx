import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import UserLoginPage from "./pages/UserLoginPage.jsx";
import UserRegisterPage from "./pages/UserRegisterPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminRegisterPage from "./pages/AdminRegisterPage.jsx";
import SubmitComplaintPage from "./pages/SubmitComplaintPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminComplaintsPage from "./pages/AdminComplaintsPage.jsx";
import ComplaintDetailsPage from "./pages/ComplaintDetailsPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const App = () => {
  const { user } = useAuth();

  return (
      <Routes>
        <Route path="/login" element={<UserLoginPage />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute
                element={
                  user?.role === "admin" ? (
                    <Navigate to="/admin" />
                  ) : (
                    <DashboardPage />
                  )
                }
              />
            }
          />
          <Route
            path="/submit"
            element={<ProtectedRoute element={<SubmitComplaintPage />} />}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<DashboardPage />} />}
          />
          <Route
            path="/complaints/:id"
            element={<ProtectedRoute element={<ComplaintDetailsPage />} />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                element={<AdminComplaintsPage />}
              />
            }
          />
        </Route>
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
  );
};

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { ForgotPassword, ResetPassword } from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentFeePage from "./pages/StudentFeePage";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Users from "./pages/Users";
import CreateApplication from "./pages/CreateApplication";
import AcademicRecords from "./pages/AcademicRecords";
import StudentRecordDetail from "./pages/StudentRecordDetail";
import AdmissionCenter from "./pages/AdmissionCenter";
import HR from "./pages/HR";
import StudentFullProfile from "./pages/StudentFullProfile";
import ClearanceSlip from "./pages/ClearanceSlip";
import ClearanceScanner from "./pages/ClearanceScanner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
              ]}
            >
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id/fee"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
              ]}
            >
              <StudentFeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
                "DataEntry",
                "RecordRoom",
                "Exam",
              ]}
            >
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
                "DataEntry",
                "RecordRoom",
                "Exam",
              ]}
            >
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Manager"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-application"
          element={
            <ProtectedRoute
              allowedRoles={["DataEntry", "Manager", "Registrar"]}
            >
              <CreateApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-records"
          element={
            <ProtectedRoute
              allowedRoles={["RecordRoom", "Manager", "Registrar"]}
            >
              <AcademicRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-records/:studentId"
          element={
            <ProtectedRoute
              allowedRoles={["RecordRoom", "Manager", "Registrar"]}
            >
              <StudentRecordDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission-center"
          element={
            <ProtectedRoute
              allowedRoles={["AdmissionCenter", "Manager", "Registrar"]}
            >
              <AdmissionCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["HR", "Manager", "Registrar"]}>
              <HR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/full-profile"
          element={
            <ProtectedRoute allowedRoles={["Manager", "Registrar"]}>
              <StudentFullProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clearance-slip"
          element={
            <ProtectedRoute
              allowedRoles={["Manager", "AccountsManager", "Registrar"]}
            >
              <ClearanceSlip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clearance-scanner"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "AccountsManager",
                "StudentAffair",
                "Registrar",
              ]}
            >
              <ClearanceScanner />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

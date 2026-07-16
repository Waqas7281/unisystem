import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoginMutation } from "../app/api";
import { setCredentials } from "../app/authSlice";
import { ROLE_LABELS } from "../components/sidebarConfig";

const ROLES = [
  "Manager",
  "AccountsManager",
  "StudentAffair",
  "RecordRoom",
  "Registrar",
  "DataEntry",
  "AdmissionCenter",
  "HR",
];

export default function Login() {
  const [role, setRole] = useState("Manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ email, password, role }).unwrap();
      dispatch(setCredentials(result));
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate(
        role === "DataEntry"
          ? "/create-application"
          : role === "RecordRoom"
            ? "/academic-records"
            : role === "AdmissionCenter"
              ? "/admission-center"
              : role === "HR"
                ? "/hr"
                : "/dashboard",
      );
    } catch (err) {
      toast.error(
        err?.data?.message || "Login failed. Check your credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-primary-700">
            🎓 UniSystem
          </Link>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            Sign in to your account
          </h2>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`text-xs px-2 py-2 rounded-lg border ${
                  role === r
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                required
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu.pk"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                required
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

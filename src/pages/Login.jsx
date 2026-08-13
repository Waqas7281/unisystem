import { useRef, useState } from "react";
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
  "Exam",
  "Registrar",
  "DataEntry",
  "AdmissionCenter",
  "HR",
];

function SealMedallion() {
  const stageRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: px * 22, ry: -py * 22 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="medallion-stage w-64 h-64 sm:w-80 sm:h-80 mx-auto flex items-center justify-center"
    >
      <div
        className="medallion relative w-56 h-56 sm:w-72 sm:h-72"
        style={{ "--rx": `${tilt.rx}deg`, "--ry": `${tilt.ry}deg` }}
      >
        <div className="medallion-ring-outer absolute inset-0 rounded-full" />
        <div className="medallion-ring-inner absolute inset-[10px] rounded-full flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="medallion-glyph w-20 h-20 sm:w-24 sm:h-24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path
              d="M32 12 L58 24 L32 36 L6 24 Z"
              fill="currentColor"
              opacity="0.15"
            />
            <path d="M32 12 L58 24 L32 36 L6 24 Z" />
            <path d="M18 30 V44 Q18 50 32 50 Q46 50 46 44 V30" />
            <path d="M58 24 V38" />
            <circle cx="58" cy="41" r="2.2" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="medallion-shine absolute inset-0 rounded-full pointer-events-none" />
      </div>
    </div>
  );
}

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
            : role === "Exam"
              ? "/applications"
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
    <div className="login-scene min-h-screen flex items-center justify-center px-4 py-10 relative">
      <span className="rr-badge absolute top-5 right-5 sm:top-7 sm:right-8 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold">
        <span className="rr-badge-dot" />
        RR
      </span>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 md:gap-6 items-center">
        {/* Left: hero / seal */}
        <div className="hidden md:flex flex-col items-center text-center px-4">
          <SealMedallion />
          <p className="text-xs tracking-[0.25em] uppercase text-[#e3b45a]/75 mt-6">
            University of South Asia
          </p>
          <h1 className="login-display text-3xl lg:text-4xl text-[#f6f1e7] mt-2 leading-tight">
            University
            <br />
            Management System
          </h1>
          <p className="text-sm text-[#f6f1e7]/55 mt-3 max-w-xs">
            One record for every student, from admission to clearance.
          </p>
        </div>

        {/* Right: login card */}
        <div className="w-full max-w-md mx-auto">
          <div className="md:hidden flex justify-center mb-4">
            <div className="scale-75 -mt-4 -mb-6">
              <SealMedallion />
            </div>
          </div>

          <div className="login-glass rounded-2xl p-6 sm:p-8">
            <p className="text-xs tracking-[0.2em] uppercase text-[#e3b45a]/80 mb-1">
              Staff Portal · University of South Asia
            </p>
            <h2 className="login-display text-2xl text-[#f6f1e7] mb-5">
              Sign in to continue
            </h2>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-active={role === r}
                  onClick={() => setRole(r)}
                  className="login-role-pill text-[11px] px-2 py-2 rounded-lg"
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#f6f1e7]/60 tracking-wide">
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  className="login-input w-full mt-1.5 px-3 py-2.5 rounded-lg text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.pk"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#f6f1e7]/60 tracking-wide">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  className="login-input w-full mt-1.5 px-3 py-2.5 rounded-lg text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="login-cta w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {isLoading ? "Signing in…" : "Login"}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                to="/forgot-password"
                className="text-sm text-[#e3b45a] hover:text-[#f3cd85] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#f6f1e7]/35 mt-5">
            🎓 UniSystem — access restricted to authorized university staff
          </p>
        </div>
      </div>
    </div>
  );
}

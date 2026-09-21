import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearLogoutReason } from "../app/authSlice";

const CONTENT = {
  blocked: {
    title: "Unauthorized",
    text: "Error in code",
  },
  expired: {
    title: "Session ended",
    text: "Your session has expired or is no longer valid. Please log in again.",
  },
  default: {
    title: "Unauthorized",
    text: "You are not authorized to view this page.",
  },
};

export default function Unauthorized() {
  const reason = useSelector((state) => state.auth.logoutReason);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { title, text } = CONTENT[reason] || CONTENT.default;

  const goToLogin = () => {
    dispatch(clearLogoutReason());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-5xl mb-3">🚫</div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500 mt-2">{text}</p>
        <button onClick={goToLogin} className="btn-primary mt-6 w-full">
          Back to Login
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../app/authSlice";
import { SIDEBAR_CONFIG, ROLE_LABELS } from "../components/sidebarConfig";
import NotificationBell from "../components/NotificationBell";
import { useGetMeQuery } from "../app/api";

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Har 10 second backend se poochta hai "kya main abhi bhi allowed hoon?"
  // Block hua to 401 aayega aur user khud logout ho kar Unauthorized page dekhega.
  useGetMeQuery(undefined, { pollingInterval: 10000, skip: !user });

  if (!user) return null;
  const links = SIDEBAR_CONFIG[user.role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="px-5 py-5 border-b">
          <h1 className="font-bold text-lg text-primary-700">🎓 UniSystem</h1>
          <p className="text-xs text-gray-400 mt-1">{ROLE_LABELS[user.role]}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.path}
              to={l.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={handleLogout} className="btn-secondary w-full">
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar - mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="px-5 py-5 border-b flex items-center justify-between">
              <div>
                <h1 className="font-bold text-lg text-primary-700">
                  🎓 UniSystem
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-400 text-xl"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {links.map((l) => (
                <NavLink
                  key={l.path}
                  to={l.path}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t">
              <button onClick={handleLogout} className="btn-secondary w-full">
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <button
            className="md:hidden text-xl"
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

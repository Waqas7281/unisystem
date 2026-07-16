import { useState } from "react";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../app/api";
import { useNavigate } from "react-router-dom";

const MAX_VISIBLE = 10;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    pollingInterval: 45000,
  });
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 45000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const navigate = useNavigate();

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    if (n.referenceType === "Application" && n.referenceId) {
      navigate(`/applications/${n.referenceId}`);
    } else if (n.referenceType === "Student" && n.referenceId) {
      navigate(`/students/${n.referenceId}/fee`);
    }
  };

  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);
  const hasMore = notifications.length > MAX_VISIBLE;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <button
              className="text-xs text-primary-600 hover:underline"
              onClick={() => markAllRead()}
            >
              Mark all read
            </button>
          </div>
          {notifications.length === 0 && (
            <p className="text-sm text-gray-500 p-4">No notifications yet.</p>
          )}
          {visibleNotifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`block w-full text-left px-4 py-3 border-b text-sm hover:bg-gray-50 ${
                !n.isRead ? "bg-primary-50" : ""
              }`}
            >
              <p className="text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
          {hasMore && (
            <div className="px-4 py-2 text-xs text-gray-400 text-center border-t">
              Showing {MAX_VISIBLE} of {notifications.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

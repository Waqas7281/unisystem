import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { WALLPAPERS } from "../data/wallpapers";
import useWallpaper from "../hooks/useWallpaper";

function Preview({ wp }) {
  const [failed, setFailed] = useState(false);

  if (wp.type === "video") {
    if (failed) {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-center text-xs text-gray-400 p-2">
          Video file nahi mili
          <br />
          {wp.src}
        </div>
      );
    }
    return (
      <video
        src={wp.src}
        poster={wp.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  if (wp.type === "css") {
    return <div className={`w-full h-full ${wp.className}`} />;
  }

  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
      No animation
    </div>
  );
}

export default function WallpaperGallery() {
  const user = useSelector((state) => state.auth.user);
  const [activeId, select] = useWallpaper(user?.id);

  const handleSelect = (wp) => {
    select(wp.id);
    toast.success(
      wp.type === "none" ? "Wallpaper hata diya" : `"${wp.name}" lag gaya`,
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Wallpaper Gallery</h1>
        <p className="text-sm text-gray-500">
          Jo animation pasand ho us par click karein, wo foran lag jayega.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {WALLPAPERS.map((wp) => {
          const active = wp.id === activeId;
          return (
            <button
              key={wp.id}
              type="button"
              onClick={() => handleSelect(wp)}
              className={`relative text-left rounded-xl overflow-hidden border bg-white shadow-sm transition hover:shadow-md ${
                active
                  ? "ring-2 ring-primary-600 border-primary-600"
                  : "border-gray-200"
              }`}
            >
              <div className="aspect-video">
                <Preview wp={wp} />
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium">{wp.name}</span>
                {active && (
                  <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

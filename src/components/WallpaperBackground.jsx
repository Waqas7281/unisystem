import { WALLPAPERS } from "../data/wallpapers";

export default function WallpaperBackground({ id }) {
  const wp = WALLPAPERS.find((w) => w.id === id);
  if (!wp || wp.type === "none") return null;

  if (wp.type === "video") {
    return (
      <video
        key={wp.src}
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src={wp.src}
        poster={wp.poster}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none ${wp.className}`} />
  );
}

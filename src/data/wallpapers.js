// Gallery mein jo bhi wallpaper dikhana hai yahan add karein.
// type: "none" | "css" | "video"
//
// Video add karne ke liye:
//   1. File ko  frontend/public/wallpapers/  mein rakhein (jaise sky.mp4)
//   2. Neeche ek entry add karein: src: "/wallpapers/sky.mp4"
//   (optional) poster: "/wallpapers/sky.jpg" — video load hone se pehle ki tasveer

export const WALLPAPERS = [
  { id: "none", name: "No Animation", type: "none" },

  // Built-in (video file ki zaroorat nahi)
  { id: "aurora", name: "Aurora", type: "css", className: "wp-aurora" },
  { id: "sunset", name: "Sunset", type: "css", className: "wp-sunset" },
  { id: "ocean", name: "Ocean", type: "css", className: "wp-ocean" },

  // Videos — apni files rakhne ke baad naam theek kar lein
  {
    id: "tanjiro",
    name: "Tanjiro — Red Moon",
    type: "video",
    src: "https://mylivewallpapers.com/wp-content/uploads/Anime/PREVIEW-Tanjiro-Red-Moon.mp4",
  },
  {
    id: "todoroki",
    name: "Todoroki — Fire & Ice",
    type: "video",
    src: "https://mylivewallpapers.com/wp-content/uploads/Anime/PREVIEW-Shoto-Todoroki-Fire-and-Ice.mp4",
  },
  {
    id: "corrupted-knight",
    name: "Corrupted Knight",
    type: "video",
    src: "https://mylivewallpapers.com/wp-content/uploads/Fantasy/PREVIEW-Corrupted-Knight.mp4",
  },
  {
    id: "computer",
    name: "computer",
    type: "video",
    src: "https://cdn.pixabay.com/video/2025/10/23/311619_large.mp4",
  },
];

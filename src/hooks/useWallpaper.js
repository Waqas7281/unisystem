import { useCallback, useEffect, useState } from "react";

const keyFor = (userId) => `wallpaper:${userId}`;

const read = (userId) => {
  try {
    return localStorage.getItem(keyFor(userId)) || "none";
  } catch {
    return "none";
  }
};

// Har user ka wallpaper alag save hota hai (is browser mein).
export default function useWallpaper(userId) {
  const [id, setId] = useState(() => read(userId));

  useEffect(() => {
    const sync = () => setId(read(userId));
    sync();
    window.addEventListener("wallpaper-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wallpaper-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [userId]);

  const select = useCallback(
    (newId) => {
      try {
        localStorage.setItem(keyFor(userId), newId);
      } catch {
        /* storage band ho to bhi app chalti rahe */
      }
      window.dispatchEvent(new Event("wallpaper-change"));
    },
    [userId],
  );

  return [id, select];
}

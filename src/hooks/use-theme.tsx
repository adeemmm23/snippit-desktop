import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    const cl = document.documentElement.classList;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      cl.add("theme-transition");
      cl.remove("dark", "light");

      cl.add(mediaQuery.matches ? "dark" : "light");

      setTimeout(() => {
        cl.remove("theme-transition");
      }, 250);
    };

    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, []);
}

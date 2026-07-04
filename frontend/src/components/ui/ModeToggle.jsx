import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="relative flex items-center justify-center w-9 h-9 rounded-full
                 bg-neutral-100 dark:bg-neutral-800
                 border border-neutral-200 dark:border-neutral-700
                 text-neutral-600 dark:text-neutral-300
                 hover:bg-neutral-200 dark:hover:bg-neutral-700
                 hover:text-neutral-900 dark:hover:text-white
                 transition-all duration-200 group"
      style={{ flexShrink: 0 }}
    >
      {/* Sun icon — visible in dark mode */}
      <Sun
        className="absolute h-4 w-4 transition-all duration-300"
        style={{
          opacity: theme === "dark" ? 1 : 0,
          transform:
            theme === "dark"
              ? "rotate(0deg) scale(1)"
              : "rotate(-90deg) scale(0.5)",
        }}
      />
      {/* Moon icon — visible in light mode */}
      <Moon
        className="absolute h-4 w-4 transition-all duration-300"
        style={{
          opacity: theme === "light" ? 1 : 0,
          transform:
            theme === "light"
              ? "rotate(0deg) scale(1)"
              : "rotate(90deg) scale(0.5)",
        }}
      />
    </button>
  );
}

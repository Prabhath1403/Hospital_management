type Theme = "light" | "dark";

const THEME_KEY = "theme";
const DEFAULT_THEME: Theme = "dark";

export function getTheme(): Theme {
  // Check if running in browser
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }
  
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  
  return DEFAULT_THEME;
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }
  
  localStorage.setItem(THEME_KEY, theme);
  
  // Apply theme to document
  const htmlElement = document.documentElement;
  
  if (theme === "dark") {
    htmlElement.classList.remove("light");
    htmlElement.classList.add("dark");
    htmlElement.style.colorScheme = "dark";
  } else {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    htmlElement.style.colorScheme = "light";
  }
  
  // Dispatch event so components can react to theme changes
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const newTheme: Theme = current === "dark" ? "light" : "dark";
  setTheme(newTheme);
  return newTheme;
}

export function initTheme(): void {
  if (typeof window === "undefined") {
    return;
  }
  
  const theme = getTheme();
  setTheme(theme);
}

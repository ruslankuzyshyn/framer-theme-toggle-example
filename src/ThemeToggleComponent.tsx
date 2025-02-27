import { useEffect } from "react";
import type { ComponentType } from "react";
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0";

/** @enum {string} Theme options for the application theme control */
const THEME = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

/** @constant {string} Key used for storing theme preference in localStorage */
const THEME_STORE_KEY = "theme";

/**
 * Retrieves the stored theme value from localStorage or returns the default theme (SYSTEM).
 * @returns {string} The theme value to use (DARK, LIGHT, or SYSTEM)
 */
const getStoredValueOrDefault = (): string => {
  const storedValue = localStorage.getItem(THEME_STORE_KEY);

  if (
    storedValue === null ||
    ![THEME.DARK, THEME.LIGHT].includes(storedValue)
  ) {
    return THEME.SYSTEM;
  }

  return storedValue;
};

/**
 * Updates the theme in both DOM and localStorage, and dispatches a theme change event.
 * @param {string} theme - The theme to set (DARK, LIGHT, or SYSTEM)
 * @returns {void}
 */
const changeTheme = (theme: string) => {
  const htmlElement = document.getElementsByTagName("html")[0];
  const bodyElement = document.getElementsByTagName("body")[0];

  htmlElement.setAttribute("toggle-theme", `${theme}`);
  bodyElement.setAttribute("toggle-theme", `${theme}`);
  localStorage.setItem(THEME_STORE_KEY, `${theme}`);

  const event = new Event("themeChange");
  window.dispatchEvent(event);
  return;
};

/**
 * Creates a store instance with the initial theme value
 * @constant {Object} Store containing theme state and setter
 */
const useStore = createStore({
  theme: getStoredValueOrDefault(),
});

/**
 * Higher-order component that adds theme toggle functionality to a component
 * @param {ComponentType} Component - The component to wrap with theme toggle functionality
 * @returns {ComponentType} A new component with theme toggle capabilities
 */
export function withSingleToggle(Component): ComponentType {
  return (props) => {
    const [store, setStore] = useStore();

    /**
     * Effect to handle system theme preference on initial load
     * Sets theme based on system preference if no explicit theme is set
     */
    useEffect(() => {
      if (![THEME.DARK, THEME.LIGHT].includes(store.theme)) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const newTheme = mediaQuery.matches ? THEME.DARK : THEME.LIGHT;
        setStore({ theme: newTheme });
      }
    }, []);

    /**
     * Handles theme toggle click event
     * Toggles between light and dark theme
     */
    const handleClick = () => {
      const newTheme = store.theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
      setStore({ theme: newTheme });
      changeTheme(newTheme);
    };

    return (
      <Component
        {...props}
        variant={store.theme === THEME.LIGHT ? "Light" : "Dark"}
        whileHover={{ scale: 1 }}
        onClick={handleClick}
      />
    );
  };
}

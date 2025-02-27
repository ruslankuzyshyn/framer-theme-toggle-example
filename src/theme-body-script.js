/** @enum {string} Theme options for the application theme control */
const THEME = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
};

/** @constant {string} Key used for storing theme preference in localStorage */
const THEME_STORE_KEY = "theme";

/** @constant {string} Attribute name used for theme toggling in HTML elements */
const THEME_TOGGLE_ATTRIBUTE = "toggle-theme";

/**
 * Removes invalid theme values from localStorage.
 * If the stored theme value is not one of the valid THEME enum values, it will be removed.
 * Ensures only valid theme naming is set in localStorage.
 * @returns {void}
 */
const clearPotentiallyInvalidThemeValue = () => {
  const storedValue = localStorage.getItem(THEME_STORE_KEY);

  if (storedValue === null) {
    return;
  }

  if (!Object.values(THEME).includes(storedValue)) {
    localStorage.removeItem(THEME_STORE_KEY);
  }
};

/**
 * Retrieves the stored theme value from localStorage or returns the default theme (SYSTEM).
 * @returns {string} The theme value to use (DARK, LIGHT, or SYSTEM)
 */
const getStoredValueOrDefault = () => {
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
 * Extracts CSS custom properties (tokens) from light theme styles.
 * @param {CSSStyleRule} rule - The CSS rule to extract tokens from
 * @returns {string} Space-separated string of CSS custom properties
 */
const extractLightTokens = (rule) => {
  if (rule.selectorText !== "body") return "";
  const tokens = [];
  const style = rule.style;

  for (let j = 0; j < style.length; j++) {
    const propertyName = style[j];
    if (propertyName.includes("--token")) {
      const value = style.getPropertyValue(propertyName);
      tokens.push(`${propertyName}: ${value};`);
    }
  }
  return tokens.join(" ");
};

/**
 * Extracts CSS custom properties (tokens) from dark theme styles.
 * @param {CSSMediaRule} rule - The CSS media rule to extract tokens from
 * @returns {string} CSS properties string for dark theme
 */
const extractDarkTokens = (rule) => {
  if (rule.conditionText !== "(prefers-color-scheme: dark)") return "";
  const cssTextIgnore = "body:not([data-framer-theme])";

  if (!rule.cssText.includes(cssTextIgnore)) {
    return rule.cssRules[0].cssText
      .replace("body", "")
      .replace(/\s*{\s*/, "")
      .replace(/\s*}\s*$/, "");
  }
  return "";
};

/**
 * Sets up theme styling for the page based on stored preferences or system settings.
 * This function:
 * 1. Cleans up invalid theme values
 * 2. Gets the current theme preference
 * 3. Handles system theme detection
 * 4. Updates HTML/body attributes
 * 5. Extracts and applies theme tokens
 * 6. Creates or updates the theme style element
 * @returns {void}
 */
const setPageThemeStylingIfThemeAvailable = () => {
  clearPotentiallyInvalidThemeValue();
  let themeToSet = getStoredValueOrDefault();

  if (themeToSet === THEME.SYSTEM) {
    // Detect system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    themeToSet = mediaQuery.matches ? THEME.DARK : THEME.LIGHT;
    localStorage.setItem(THEME_STORE_KEY, themeToSet);
  } else {
    localStorage.setItem(THEME_STORE_KEY, themeToSet);
  }

  // Create attributes on html and body so that theme will be applied based on store
  const htmlElement = document.getElementsByTagName("html")[0];
  const bodyElement = document.getElementsByTagName("body")[0];
  htmlElement && htmlElement.setAttribute(THEME_TOGGLE_ATTRIBUTE, themeToSet);
  bodyElement && bodyElement.setAttribute(THEME_TOGGLE_ATTRIBUTE, themeToSet);
  let lightThemeTokens = [];
  let darkThemeTokens = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      for (let rule of sheet.cssRules) {
        lightThemeTokens = extractLightTokens(rule) || lightThemeTokens;
        darkThemeTokens = extractDarkTokens(rule) || darkThemeTokens;
      }
    } catch (e) {
      console.warn("Cannot access stylesheet:", sheet.href);
    }
  }

  // Prevent multiple style elements from being created
  const existingStyleElement = document.getElementById(THEME_TOGGLE_ATTRIBUTE);
  if (existingStyleElement) {
    document.head.removeChild(existingStyleElement);
  }

  const styleElement = document.createElement("style");
  styleElement.id = THEME_TOGGLE_ATTRIBUTE;
  const customCssRule = `body[${THEME_TOGGLE_ATTRIBUTE}="${THEME.LIGHT}"] {${lightThemeTokens}} body[${THEME_TOGGLE_ATTRIBUTE}="${THEME.DARK}"] {${darkThemeTokens}} html[${THEME_TOGGLE_ATTRIBUTE}="${THEME.LIGHT}"] { color-scheme: light; } html[${THEME_TOGGLE_ATTRIBUTE}="${THEME.DARK}"] { color-scheme: dark; }`;
  styleElement.textContent = customCssRule;
  document.head.appendChild(styleElement);
};

// Initialize theme styling when script loads
setPageThemeStylingIfThemeAvailable();

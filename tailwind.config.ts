import type { Config } from "tailwindcss";

/**
 * Apple-design-analysis tokens.
 * Single blue accent, near-black inks, parchment + dark tiles, one product shadow.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
        "primary-focus": "#0071e3",
        "primary-on-dark": "#2997ff",
        ink: "#1d1d1f",
        body: "#1d1d1f",
        "body-on-dark": "#ffffff",
        "body-muted": "#cccccc",
        "ink-muted-80": "#333333",
        "ink-muted-48": "#7a7a7a",
        "divider-soft": "#f0f0f0",
        hairline: "#e0e0e0",
        canvas: "#ffffff",
        parchment: "#f5f5f7",
        pearl: "#fafafc",
        "tile-1": "#272729",
        "tile-2": "#2a2a2c",
        "tile-3": "#252527",
        "surface-black": "#000000",
        "chip-translucent": "#d2d2d7",

        // --- Airtable-design-analysis tokens (homepage editorial surface) ---
        // Namespaced with `at-` so they never collide with the Apple set above.
        "at-primary": "#181d26",
        "at-primary-active": "#0d1218",
        "at-ink": "#181d26",
        "at-body": "#333840",
        "at-muted": "#41454d",
        "at-hairline": "#dddddd",
        "at-border-strong": "#9297a0",
        "at-canvas": "#ffffff",
        "at-surface-soft": "#f8fafc",
        "at-surface-strong": "#e0e2e6",
        "at-surface-dark": "#181d26",
        "at-coral": "#aa2d00",
        "at-forest": "#0a2e0e",
        "at-cream": "#f5e9d4",
        "at-peach": "#fcab79",
        "at-mint": "#a8d8c4",
        "at-yellow": "#f4d35e",
        "at-mustard": "#d9a441",
        "at-on-dark": "#ffffff",
        "at-link": "#1b61c9",
        "at-link-active": "#1a3866",
        "at-info-border": "#458fff",
        "at-success": "#006400",
      },
      fontFamily: {
        display: [
          "SF Pro Display",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "sans-serif",
        ],
        text: [
          "SF Pro Text",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "sans-serif",
        ],
        // Airtable editorial voice: Haas Grotesk -> Inter Display fallback.
        haas: [
          "Haas Grotesk",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        // token: [size, { lineHeight, letterSpacing }]
        "hero-display": ["56px", { lineHeight: "1.07", letterSpacing: "-0.28px" }],
        "display-lg": ["40px", { lineHeight: "1.1", letterSpacing: "0px" }],
        "display-md": ["34px", { lineHeight: "1.47", letterSpacing: "-0.374px" }],
        lead: ["28px", { lineHeight: "1.14", letterSpacing: "0.196px" }],
        "lead-airy": ["24px", { lineHeight: "1.5", letterSpacing: "0px" }],
        tagline: ["21px", { lineHeight: "1.19", letterSpacing: "0.231px" }],
        "body-strong": ["17px", { lineHeight: "1.24", letterSpacing: "-0.374px" }],
        "body-apple": ["17px", { lineHeight: "1.47", letterSpacing: "-0.374px" }],
        "dense-link": ["17px", { lineHeight: "2.41", letterSpacing: "0px" }],
        caption: ["14px", { lineHeight: "1.43", letterSpacing: "-0.224px" }],
        "caption-strong": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px" }],
        "button-large": ["18px", { lineHeight: "1", letterSpacing: "0px" }],
        "button-utility": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px" }],
        "fine-print": ["12px", { lineHeight: "1", letterSpacing: "-0.12px" }],
        "micro-legal": ["10px", { lineHeight: "1.3", letterSpacing: "-0.08px" }],
        "nav-link": ["12px", { lineHeight: "1", letterSpacing: "-0.12px" }],

        // --- Airtable-design-analysis type scale ---
        "at-display-xl": ["48px", { lineHeight: "1.1", letterSpacing: "0px" }],
        "at-display-lg": ["40px", { lineHeight: "1.2", letterSpacing: "0px" }],
        "at-display-md": ["32px", { lineHeight: "1.2", letterSpacing: "0px" }],
        "at-title-lg": ["24px", { lineHeight: "1.35", letterSpacing: "0.12px" }],
        "at-title-md": ["20px", { lineHeight: "1.5", letterSpacing: "0px" }],
        "at-title-sm": ["18px", { lineHeight: "1.4", letterSpacing: "0px" }],
        "at-label-md": ["16px", { lineHeight: "1.4", letterSpacing: "0px" }],
        "at-button": ["16px", { lineHeight: "1.4", letterSpacing: "0px" }],
        "at-body-md": ["14px", { lineHeight: "1.25", letterSpacing: "0px" }],
        "at-caption": ["14px", { lineHeight: "1.35", letterSpacing: "0.16px" }],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "17px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
      },
      borderRadius: {
        none: "0px",
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        pill: "9999px",
        full: "9999px",

        // --- Airtable-design-analysis radii ---
        "at-xs": "2px",
        "at-sm": "6px",
        "at-md": "10px",
        "at-lg": "12px",
      },
      boxShadow: {
        // The single system shadow — reserved for "product" imagery / hero artifacts.
        product: "3px 5px 30px 0 rgba(0, 0, 0, 0.22)",
        // Airtable homepage card elevation (rest + hover lift).
        "at-card": "0 1px 2px 0 rgba(24, 29, 38, 0.06)",
        "at-card-hover": "0 8px 24px -6px rgba(24, 29, 38, 0.18)",
        // Lively hover glow for game cards (coral-tinted).
        "at-glow": "0 10px 30px -6px rgba(170, 45, 0, 0.28)",
      },
      maxWidth: {
        content: "980px",
        grid: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;

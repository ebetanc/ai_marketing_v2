import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { dirname } from "path";
import tseslint from "typescript-eslint"; // unified export (includes config helper)
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = tseslint.config(
  // Legacy style configs via compat (keep prettier last among them)
  ...compat.extends("plugin:jsx-a11y/recommended", "prettier"),
  // TypeScript specific rules (minimal set to avoid crash from full recommended)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        ecmaFeatures: undefined,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
    },
    rules: {
      // Add project-specific TS rules here
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn", // consider raising to error after cleanup
    },
  },
  // JavaScript (including mjs) files
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Global ignores
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "scripts/**"],
  },
);

export default eslintConfig;

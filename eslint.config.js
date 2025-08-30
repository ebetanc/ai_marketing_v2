import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
// Prettier config integration: extends at end disables stylistic ESLint rules conflicting with Prettier
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Temporary workaround: disable due to crash with ESLint v9 proxying core no-unused-expressions
      "@typescript-eslint/no-unused-expressions": "off",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          // Allow named non-component exports that are safe with Fast Refresh
          allowExportNames: ["useToast", "useAuth"],
        },
      ],
      // Loosen strict rules temporarily to keep momentum; tighten later with a types pass
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "no-constant-binary-expression": "off",
      // a11y: enforce labels for icon-only controls and accessible interactions
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/no-static-element-interactions": [
        "warn",
        { allowExpressionValues: true },
      ],
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/control-has-associated-label": [
        "warn",
        {
          ignoreElements: [
            "IconButton", // custom component enforces aria-label prop
          ],
          ignoreRoles: [],
          labelAttributes: ["label"],
          controlComponents: ["IconButton"],
          depth: 3,
        },
      ],
      // Let Prettier handle formatting differences instead of ESLint complaining
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
      // Surface Prettier formatting issues as ESLint errors for single-run convenience
      "prettier/prettier": "error",
    },
  },
);

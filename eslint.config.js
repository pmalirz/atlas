import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["**/dist/**", "**/node_modules/**"] },

    // 1. Base Configuration (for all TS/JS files)
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "warn"
        }
    },

    // 2. Client-side Configuration (Atlas UI)
    {
        files: ["atlas-ui/**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    }
);

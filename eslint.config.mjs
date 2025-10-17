import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores (Flat config replacement for .eslintignore)
  {
    ignores: [
      'lib/database.types.ts',
      'tsconfig.tsbuildinfo',
      'node_modules',
      '.next',
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["components/ui/**/*.ts", "components/ui/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;

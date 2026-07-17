// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '**/dist/**',
      '**/.expo/**',
      '**/.next/**',
      'apps/web/**',
      // functions/ is its own TypeScript project (separate tsconfig, node_modules,
      // and module resolution) — not an Expo/RN app, so it doesn't belong under
      // this root config. It has no lint script of its own; typecheck still
      // covers it via `pnpm typecheck`.
      'functions/**',
      '**/node_modules/**',
    ],
  },
]);

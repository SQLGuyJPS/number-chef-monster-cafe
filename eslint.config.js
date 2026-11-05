// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** Shared-origin hygiene (SPEC §11.5, D18): never wipe storage that other Pages apps own. */
const storageHygiene = [
  { object: 'localStorage', property: 'clear', message: 'Shared github.io origin: delete only ncmc* keys (SPEC §11.5).' },
  { object: 'sessionStorage', property: 'clear', message: 'Shared github.io origin: delete only ncmc* keys (SPEC §11.5).' },
  { object: 'window.localStorage', property: 'clear', message: 'Shared github.io origin (SPEC §11.5).' },
];

/** All pointer math goes through toStageCoords (SPEC §2.2); raw coordinates only in the input module. */
const rawCoords = ['clientX', 'clientY', 'pageX', 'pageY', 'screenX', 'screenY'].map((property) => ({
  property,
  message: 'Read pointer coordinates only in src/game/input (toStageCoords, SPEC §2.2).',
}));

export default tseslint.config(
  { ignores: ['dist/**', 'dist-e2e/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-restricted-properties': ['error', ...storageHygiene],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-properties': ['error', ...storageHygiene, ...rawCoords],
    },
  },
  {
    files: ['src/game/input/**/*.{ts,tsx}'],
    rules: { 'no-restricted-properties': ['error', ...storageHygiene] },
  },
  {
    // Engine purity (SPEC §2.1, CLAUDE.md): no React, no DOM, no ambient clock or randomness.
    files: ['src/engine/**/*.ts'],
    languageOptions: { globals: { ...globals.es2021 } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*', 'react-dom/*'], message: 'src/engine is pure TS (no React).' },
            { group: ['idb', 'idb/*'], message: 'src/engine is pure TS (no IndexedDB).' },
            { group: ['../app/*', '../game/*', '../audio/*', '../storage/*', '../parent/*', '../art/*'], message: 'src/engine may not import UI or platform layers.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'indexedDB', 'localStorage', 'sessionStorage', 'location', 'history', 'performance', 'speechSynthesis', 'requestAnimationFrame', 'setTimeout', 'setInterval'].map(
          (name) => ({ name, message: `src/engine is pure: no ${name} (inject it).` }),
        ),
      ],
      'no-restricted-properties': [
        'error',
        ...storageHygiene,
        { object: 'Date', property: 'now', message: 'Inject a clock into the engine.' },
        { object: 'Math', property: 'random', message: 'Use the seeded rng (mulberry32).' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Inject a clock into the engine.' },
      ],
    },
  },
  prettier,
);

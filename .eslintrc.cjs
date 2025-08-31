module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', 'src/config/deepseekMessages.ts', 'src/config/deepseekMessages.example.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh', '@typescript-eslint', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/no-unescaped-entities': 'off', // Allow apostrophes in JSX
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_|^unused' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off', // Allow console statements in development
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
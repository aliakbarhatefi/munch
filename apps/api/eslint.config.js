// apps/api/eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url)) // => /home/ali/munch/apps/api

export default [
  // Ignore build output
  { ignores: ['dist/**'] },

  // JS rules (covers this config file too)
  js.configs.recommended,

  // TS base (non type-aware)
  ...tseslint.configs.recommended,

  // TS type-aware rules — only for .ts files in this package
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], // use api tsconfig
        tsconfigRootDir, // must be a string
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]

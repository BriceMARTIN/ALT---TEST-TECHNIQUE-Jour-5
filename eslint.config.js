import js from '@eslint/js';

export default [
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly'
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  js.configs.recommended,
  {
    rules: {
      'indent': 'off',
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
    }
  }
];

import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Ignorar pastas
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage', '.env', '*.config.js'],
  },

  // 2. Configuração Base para arquivos JS
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest, // <--- Adicionamos isso para corrigir os testes
      },
    },
  },

  // 3. Regras Padrão
  pluginJs.configs.recommended,

  // 4. Integração Prettier
  eslintPluginPrettierRecommended,

  // 5. Suas Regras Personalizadas
  {
    rules: {
      'no-console': 'off', // Logs permitidos
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Ignora args de função com _ (ex: _next)
          varsIgnorePattern: '^_', // Ignora variáveis com _ (ex: _password)
          caughtErrorsIgnorePattern: '^_', // Ignora erros de catch com _ (ex: _err)
        },
      ],
    },
  },
];

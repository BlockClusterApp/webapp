module.exports = {
    extends: ['airbnb-base', 'prettier'],
    env: {
      node: true,
    },
    plugins: ['import'],
    parserOptions: {
      parser: 'babel-eslint',
      ecmaVersion: 2017,
      sourceType: 'module',
      ecmaFeatures: {
        modules: false,
      },
    },
    rules: {
      "camelcase": "off",
      "guard-for-in": "off",
      "import/prefer-default-export": "off",
      "import/no-unresolved": "off",
      "no-console": "warn",
      'no-unexpected-multiline': 'off',
      'no-else-return': 'off',
      'no-restricted-syntax': 'off',
      'max-len': 'off',
      'func-names': 'off',
      'import/no-dynamic-require': 'off',
      'no-plusplus': [
        'error',
        {
          allowForLoopAfterthoughts: true,
        },
      ],
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
      camelcase: [
        'error',
        {
          properties: 'never',
        },
      ],
      'no-underscore-dangle': ['off'],
      strict: [2, 'global'],
      'no-use-before-define': [
        'error',
        {
          functions: false,
        },
      ],
    },
    globals: {
      Npm: true,
      HTTP: true,
      Meteor: true,
      Accounts: true,
      JsonRoutes: true
    }
  };
  
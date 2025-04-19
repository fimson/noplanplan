module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    commonjs: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "commonjs",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-undef": "error",
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double"],
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "max-len": ["error", { "code": 120 }],
    "object-curly-spacing": ["error", "always"],
    "indent": ["error", 2],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {
    module: "readonly",
    require: "readonly",
    exports: "readonly",
    process: "readonly",
    __dirname: "readonly"
  },
  ignorePatterns: [
    "/lib/**/*",
    "/node_modules/**/*",
  ],
};
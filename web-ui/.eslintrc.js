module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: "babel-eslint",
  extends: ["plugin:react/recommended", "plugin:prettier/recommended"],
  plugins: [],
  // add your custom rules here
  rules: {
    "react/prop-types": 1,
    "prettier/prettier": [
      "error",
      { singleQuote: false, trailingComma: "es5" },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

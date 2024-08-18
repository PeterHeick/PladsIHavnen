module.exports = {
  root: true,
  env: {
    node: true,
    // Tilføj denne linje for at inkludere browser globale variabler
    browser: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "quotes": "off",
    "semi": "off",
    "indent": "off",
    "no-unused-vars": "warn",
    "space-before-function-paren": "off",
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "vue/no-multiple-template-root": "off",
    // Tilføj denne regel for at tillade 'google' som en global variabel
    "no-undef": "off",
  },
  // Tilføj denne sektion for at definere 'google' som en global variabel
  globals: {
    google: "readonly",
  },
};

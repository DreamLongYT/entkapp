export default {
  env: "staging",
  version: "1.0.0-staging",
  debug: false,
  features: {
    enableDynamicImports: true,
    enableCircularDetection: false,
    enableBarrelOptimization: true,
    enableLegacyCompat: false,
    maxCircularDepth: 5,
  },
  plugins: ["core", "auth", "storage"],
  adapters: {},
};

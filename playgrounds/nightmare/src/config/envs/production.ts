export default {
  env: "production",
  version: "1.0.0",
  debug: false,
  features: {
    enableDynamicImports: false,
    enableCircularDetection: false,
    enableBarrelOptimization: true,
    enableLegacyCompat: false,
    maxCircularDepth: 3,
  },
  plugins: ["core", "auth", "storage"],
  adapters: {},
};

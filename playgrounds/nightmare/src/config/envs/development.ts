export default {
  env: "development",
  version: "1.0.0-dev",
  debug: true,
  features: {
    enableDynamicImports: true,
    enableCircularDetection: true,
    enableBarrelOptimization: false,
    enableLegacyCompat: true,
    maxCircularDepth: 10,
  },
  plugins: ["core", "auth", "storage"],
  adapters: { database: { host: "localhost", port: 5432, database: "dev_db" } },
};

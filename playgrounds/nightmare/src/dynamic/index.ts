// Dynamic module hub – every export here is also dynamically imported
// This creates maximum confusion for static analyzers

export { default as ComputedModule } from "./computed.js";
export * from "./factory.js";
export * from "./loader.js";
export * from "./registry.js";

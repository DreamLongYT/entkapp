const path = require('path');
const fs = require('fs');

/**
 * entkapp Legacy CJS Wrapper
 * Allows the tool to be used in older Node.js environments.
 */
module.exports = async function runLegacy() {
  console.log("⚠️ Running in Legacy CommonJS mode...");
  const { EntkappEngine } = await import('./src/index.js');
  const { EngineContext } = await import('./src/EngineContext.js');
  
  const targetCwd = process.cwd();
  const context = new EngineContext(targetCwd);
  const engine = new EntkappEngine(context);
  
  return engine.run();
};

import { OxcAnalyzer as CoreOxcAnalyzer } from '../ast/OxcAnalyzer.mjs';

/**
 * Proxy for the Core OxcAnalyzer to maintain backward compatibility
 * while centralizing the implementation.
 */
export class OxcAnalyzer extends CoreOxcAnalyzer {
    constructor(context) {
        super(context);
    }
}

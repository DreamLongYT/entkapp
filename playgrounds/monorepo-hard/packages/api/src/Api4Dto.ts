export interface IApi4Dto { execute(): void; }
export class Api4Dto implements IApi4Dto {
  execute() { console.log('Api4Dto executed'); }
}
// ❌ UNUSED ENTERPRISE CODE
export const DEPRECATED_4 = 'old';

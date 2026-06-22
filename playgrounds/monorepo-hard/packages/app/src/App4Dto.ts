export interface IApp4Dto { execute(): void; }
export class App4Dto implements IApp4Dto {
  execute() { console.log('App4Dto executed'); }
}
// ❌ UNUSED ENTERPRISE CODE
export const DEPRECATED_4 = 'old';

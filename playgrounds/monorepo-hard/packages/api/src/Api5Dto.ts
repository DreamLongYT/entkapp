export interface IApi5Dto { execute(): void; }
export class Api5Dto implements IApi5Dto {
  execute() { console.log('Api5Dto executed'); }
}

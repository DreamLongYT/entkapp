export interface IApi3Dto { execute(): void; }
export class Api3Dto implements IApi3Dto {
  execute() { console.log('Api3Dto executed'); }
}

export interface IApi2Dto { execute(): void; }
export class Api2Dto implements IApi2Dto {
  execute() { console.log('Api2Dto executed'); }
}

export interface IApi10Dto { execute(): void; }
export class Api10Dto implements IApi10Dto {
  execute() { console.log('Api10Dto executed'); }
}

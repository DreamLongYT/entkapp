export interface IApi1Dto { execute(): void; }
export class Api1Dto implements IApi1Dto {
  execute() { console.log('Api1Dto executed'); }
}

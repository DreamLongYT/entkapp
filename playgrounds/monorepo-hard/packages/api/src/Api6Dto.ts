export interface IApi6Dto { execute(): void; }
export class Api6Dto implements IApi6Dto {
  execute() { console.log('Api6Dto executed'); }
}

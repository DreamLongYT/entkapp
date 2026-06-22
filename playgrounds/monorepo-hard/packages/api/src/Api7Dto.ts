export interface IApi7Dto { execute(): void; }
export class Api7Dto implements IApi7Dto {
  execute() { console.log('Api7Dto executed'); }
}

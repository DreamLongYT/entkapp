export interface IApi11Dto { execute(): void; }
export class Api11Dto implements IApi11Dto {
  execute() { console.log('Api11Dto executed'); }
}

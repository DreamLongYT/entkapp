export interface IApi9Dto { execute(): void; }
export class Api9Dto implements IApi9Dto {
  execute() { console.log('Api9Dto executed'); }
}

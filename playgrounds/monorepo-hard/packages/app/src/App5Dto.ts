export interface IApp5Dto { execute(): void; }
export class App5Dto implements IApp5Dto {
  execute() { console.log('App5Dto executed'); }
}

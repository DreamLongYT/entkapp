export interface IApp2Dto { execute(): void; }
export class App2Dto implements IApp2Dto {
  execute() { console.log('App2Dto executed'); }
}

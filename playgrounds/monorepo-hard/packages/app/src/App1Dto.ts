export interface IApp1Dto { execute(): void; }
export class App1Dto implements IApp1Dto {
  execute() { console.log('App1Dto executed'); }
}

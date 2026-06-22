export interface IApp3Dto { execute(): void; }
export class App3Dto implements IApp3Dto {
  execute() { console.log('App3Dto executed'); }
}

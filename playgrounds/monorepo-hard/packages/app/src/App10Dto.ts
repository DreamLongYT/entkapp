export interface IApp10Dto { execute(): void; }
export class App10Dto implements IApp10Dto {
  execute() { console.log('App10Dto executed'); }
}

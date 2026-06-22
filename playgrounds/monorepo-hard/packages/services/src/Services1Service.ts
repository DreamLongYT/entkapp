export interface IServices1Service { execute(): void; }
export class Services1Service implements IServices1Service {
  execute() { console.log('Services1Service executed'); }
}

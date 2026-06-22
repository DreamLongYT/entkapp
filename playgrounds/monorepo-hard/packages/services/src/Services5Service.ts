export interface IServices5Service { execute(): void; }
export class Services5Service implements IServices5Service {
  execute() { console.log('Services5Service executed'); }
}

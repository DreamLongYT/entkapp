export interface IServices2Service { execute(): void; }
export class Services2Service implements IServices2Service {
  execute() { console.log('Services2Service executed'); }
}

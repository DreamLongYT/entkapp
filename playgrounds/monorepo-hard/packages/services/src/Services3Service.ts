export interface IServices3Service { execute(): void; }
export class Services3Service implements IServices3Service {
  execute() { console.log('Services3Service executed'); }
}

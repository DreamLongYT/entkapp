export interface IDomain2Repository { execute(): void; }
export class Domain2Repository implements IDomain2Repository {
  execute() { console.log('Domain2Repository executed'); }
}

export interface IDomain10Repository { execute(): void; }
export class Domain10Repository implements IDomain10Repository {
  execute() { console.log('Domain10Repository executed'); }
}

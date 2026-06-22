export interface IDomain22Repository { execute(): void; }
export class Domain22Repository implements IDomain22Repository {
  execute() { console.log('Domain22Repository executed'); }
}

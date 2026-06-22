export interface IDomain5Repository { execute(): void; }
export class Domain5Repository implements IDomain5Repository {
  execute() { console.log('Domain5Repository executed'); }
}

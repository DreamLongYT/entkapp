export interface IDomain21Repository { execute(): void; }
export class Domain21Repository implements IDomain21Repository {
  execute() { console.log('Domain21Repository executed'); }
}

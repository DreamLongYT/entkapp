export interface IDomain9Repository { execute(): void; }
export class Domain9Repository implements IDomain9Repository {
  execute() { console.log('Domain9Repository executed'); }
}

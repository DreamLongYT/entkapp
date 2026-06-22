export interface IDomain18Repository { execute(): void; }
export class Domain18Repository implements IDomain18Repository {
  execute() { console.log('Domain18Repository executed'); }
}

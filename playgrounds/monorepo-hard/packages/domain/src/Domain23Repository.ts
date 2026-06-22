export interface IDomain23Repository { execute(): void; }
export class Domain23Repository implements IDomain23Repository {
  execute() { console.log('Domain23Repository executed'); }
}

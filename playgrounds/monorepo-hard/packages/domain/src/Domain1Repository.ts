export interface IDomain1Repository { execute(): void; }
export class Domain1Repository implements IDomain1Repository {
  execute() { console.log('Domain1Repository executed'); }
}

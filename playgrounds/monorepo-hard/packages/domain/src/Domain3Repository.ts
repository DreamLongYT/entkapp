export interface IDomain3Repository { execute(): void; }
export class Domain3Repository implements IDomain3Repository {
  execute() { console.log('Domain3Repository executed'); }
}

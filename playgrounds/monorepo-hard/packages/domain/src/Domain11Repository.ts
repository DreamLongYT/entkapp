export interface IDomain11Repository { execute(): void; }
export class Domain11Repository implements IDomain11Repository {
  execute() { console.log('Domain11Repository executed'); }
}

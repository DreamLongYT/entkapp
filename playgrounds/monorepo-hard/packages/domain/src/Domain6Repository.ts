export interface IDomain6Repository { execute(): void; }
export class Domain6Repository implements IDomain6Repository {
  execute() { console.log('Domain6Repository executed'); }
}

export interface IDomain7Repository { execute(): void; }
export class Domain7Repository implements IDomain7Repository {
  execute() { console.log('Domain7Repository executed'); }
}

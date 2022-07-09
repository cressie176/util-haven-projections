import { TemporalRecordType, SchemasEntryType, FileSystemType } from "../../src";

export default class StubFileSystem implements FileSystemType {
  private _data: TemporalRecordType<any>[];
  private _schemas: SchemasEntryType[];
  private _packages: any = {};

  constructor(data: TemporalRecordType<any>[], schemas: SchemasEntryType[]) {
    this._data = data;
    this._schemas = schemas;
    this._packages = {};
  }

  get packages() {
    return this._packages;
  }

  loadDataSource(source: string): TemporalRecordType<any>[] {
    return this._data;
  }

  loadSchemas(projection: string): SchemasEntryType[] {
    return this._schemas;
  }

  getPackageDir(packageName: string): string {
    throw new Error("Method not implemented.");
  }

  initPackage(packageName: string, packageVersion: string): void {
    this._packages[packageName] = { name: packageName, version: packageVersion, variants: {} };
  }

  writePackageTypes(packageName: string, projectionName: string, typedef: string): void {
    this._packages[packageName].typedef = typedef;
  }

  writeVariant(packageName: string, variantName: string, records: TemporalRecordType<any>[], script: string, typedef: string): void {
    this._packages[packageName].variants[variantName] = { records, script, typedef };
  }
}

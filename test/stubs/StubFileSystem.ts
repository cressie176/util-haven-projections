import { TemporalRecordType, SchemasEntryType, FileSystemType } from "../../src";

export default class StubFileSystem implements FileSystemType {
  private _data: TemporalRecordType[];
  private _schemas: SchemasEntryType[];
  private _packages: any = {};

  constructor(data: TemporalRecordType[], schemas: SchemasEntryType[]) {
    this._data = data;
    this._schemas = schemas;
    this._packages = {};
  }

  get packages() {
    return this._packages;
  }

  loadDataSource(source: string): TemporalRecordType[] {
    return this._data;
  }

  loadSchemas(projection: string): SchemasEntryType[] {
    return this._schemas;
  }

  getPackageDir(packageName: string): string {
    throw new Error("Method not implemented.");
  }

  initPackage(packageName: string, packageVersion: string, projectionName: string): void {
    this._packages[packageName] = { name: packageName, version: packageVersion, variants: {} };
  }

  writeVariant(packageName: string, variantName: string, records: TemporalRecordType[], script: string, typedef: string): void {
    this._packages[packageName].variants[variantName] = { records, script, typedef };
  }
}

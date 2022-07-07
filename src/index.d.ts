import { AnySchema } from "yup";

export type DataSourceType = {
  fetch(): Promise<TemporalRecordType[]>;
};

export type TemporalRecordType = {
  effectiveDate: Date;
  data: Array<any>;
};

export type SchemasEntryType = {
  version: string;
  schema: AnySchema;
};

export type FileSystemType = {
  loadDataSource(sourceName: string): TemporalRecordType[];
  loadSchemas(projectionName: string): SchemasEntryType[];
  getPackageDir(packageName: string): string;
  initPackage(packageName: string, packageVersion: string, projectionName: string): void;
  writeVariant(packageName: string, variantName: string, records: TemporalRecordType[], script: string, typedef: string): void;
};

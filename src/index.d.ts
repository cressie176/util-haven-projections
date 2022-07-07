import { AnySchema } from "yup";

export type DataSourceType<T> = {
  fetch(): Promise<TemporalRecordType<T>[]>;
};

export type TemporalRecordType<T> = {
  effectiveDate: Date;
  data: Array<T>;
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

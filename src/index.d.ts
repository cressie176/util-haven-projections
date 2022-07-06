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

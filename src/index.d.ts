import { AnySchema } from "yup";

export type TemporalProjectionType = {
  name: string;
  version: string;
  types: string;
  records: TemporalRecordType[];
};

export type TemporalRecordType = {
  effectiveDate: Date;
  data: Array<any>;
};

export type SchemasEntryType = {
  version: string;
  schema: AnySchema;
};

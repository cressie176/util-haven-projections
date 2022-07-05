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

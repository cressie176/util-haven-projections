import { DataSourceType, TemporalRecordType } from "..";

export default class LocalDataSource implements DataSourceType {
  private _name: string;
  private _records: TemporalRecordType[];

  constructor(name: string, records: TemporalRecordType[]) {
    this._name = name;
    this._records = records;
  }

  async fetch(): Promise<TemporalRecordType[]> {
    return this._records;
  }
}

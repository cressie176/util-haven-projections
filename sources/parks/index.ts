import LocalDataSource, { LocalDataSourceOptionsType } from "../../src/datasources/LocalDataSource";

export default class ParksDataSource extends LocalDataSource {
  constructor(options?: LocalDataSourceOptionsType) {
    super("parks", options);
  }
}

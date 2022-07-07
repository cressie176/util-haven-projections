import { ParkType } from "./index.d";
import LocalDataSource, { LocalDataSourceOptionsType } from "../../../../src/datasources/LocalDataSource";

export default class ParksDataSource extends LocalDataSource<ParkType> {
  constructor(options?: LocalDataSourceOptionsType) {
    super("parks", options);
  }
}

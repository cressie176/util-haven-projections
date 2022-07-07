import Projection, { ProjectionOptionsType } from "../../src/Projection";
import { ParkType as SourceType } from "../../sources/parks/index.d";
import { ProjectionType } from "./index.d";
import { DataSourceType } from "../../src";

export default class Parks extends Projection<SourceType, ProjectionType> {
  constructor(dataSource: DataSourceType, options?: ProjectionOptionsType) {
    super("parks", "1.0.0", dataSource, options);
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks;
  }
}

import Projection, { ProjectionOptionsType } from "../../src/Projection";
import { SourceType } from "../../sources/parks/index.d";
import { ProjectionType } from "./index.d";
import { DataSourceType } from "../../src";

export default class ParkOpeningDates extends Projection<SourceType, ProjectionType> {
  constructor(dataSource: DataSourceType<SourceType>, options?: ProjectionOptionsType) {
    super("park-opening-dates", "1.0.0", dataSource, options);
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks.map(({ code, openingDates }) => {
      return { code, openingDates };
    });
  }
}

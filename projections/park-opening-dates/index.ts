import Projection, { ProjectionOptionsType } from "../../src/Projection";
import parkDataSource from "../../sources/parks";
import { SourceType } from "../../sources/parks/index.d";
import { ProjectionType } from "./index.d";

export default class ParkOpeningDates extends Projection<SourceType, ProjectionType> {
  constructor(options?: ProjectionOptionsType) {
    super("park-opening-dates", "1.0.0", parkDataSource, options);
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks.map(({ code, openingDates }) => {
      return { code, openingDates };
    });
  }
}

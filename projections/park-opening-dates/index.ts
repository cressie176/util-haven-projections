import Projection from "../../src/Projection";
import { SourceType } from "../../sources/parks";
import { ProjectionType } from "./index.d";

export default class ParkOpeningDates extends Projection<SourceType, ProjectionType> {
  constructor() {
    super("park-opening-dates", "1.0.0", "parks");
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks.map(({ code, openingDates }) => {
      return { code, openingDates };
    });
  }
}

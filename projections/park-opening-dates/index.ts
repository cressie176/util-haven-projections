import Projection from "../../src/Projection";
import { SourceType } from "../../sources/parks";
import { ProjectionType } from "./types";

export default class ParkOpeningDates extends Projection<
  SourceType,
  ProjectionType
> {
  constructor() {
    super({ baseDir: __dirname, version: "1.0.0", source: "parks" });
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks.map(({ code, openingDates }) => {
      return { code, openingDates };
    });
  }
}

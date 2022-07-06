import Projection from "../../src/Projection";

import { ParkType as SourceType } from "../../sources/parks";
import { ProjectionType } from "./index.d";

export default class Parks extends Projection<SourceType, ProjectionType> {
  constructor() {
    super({ baseDir: __dirname, version: "1.0.0", source: "parks" });
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks;
  }
}

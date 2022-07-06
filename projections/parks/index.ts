import Projection from "../../src/Projection";

import { ParkType as SourceType } from "../../sources/parks";
import { ProjectionType } from "./index.d";

export default class Parks extends Projection<SourceType, ProjectionType> {
  constructor() {
    super("parks", "1.0.0", "parks");
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks;
  }
}

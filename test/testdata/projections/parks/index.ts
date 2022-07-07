import Projection from "../../../../src/Projection";
import parkDataSource from "../../sources/parks";
import { ParkType as SourceType } from "../../sources/parks/index.d";
import { ProjectionType } from "./index.d";

export default class Parks extends Projection<SourceType, ProjectionType> {
  constructor() {
    super("parks", "1.0.0", parkDataSource);
  }

  _build(parks: SourceType[]): ProjectionType[] {
    return parks;
  }
}

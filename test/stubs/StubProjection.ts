import Projection from "../../src/Projection";
import { DataSourceType, FileSystemType } from "../../src";

type SourceType = {
  givenNames: string[];
  surname: string;
};

type ProjectionType = {
  fullName: string;
};

export default class StubProjection extends Projection<SourceType, ProjectionType> {
  constructor(version: string, dataSource: DataSourceType<any>, fileSystem: FileSystemType) {
    super("staff-full-names", version, dataSource, { fileSystem });
  }

  _build(people: SourceType[]): ProjectionType[] {
    return people.map((person) => {
      const fullName = person.givenNames.concat(person.surname).join(" ");
      return { fullName };
    });
  }
}

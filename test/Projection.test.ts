import { strictEqual as eq, deepStrictEqual as deq } from "assert";
import { describe, it } from "zunit";
import { object, array, string } from "yup";
import FileSystem from "../src/FileSystem";
import Projection from "../src/Projection";
import { TemporalRecordType, SchemasEntryType } from "../src";

export default describe("Projection", () => {
  it("should generate temporal records", () => {
    const fileSystem = new StubFileSystem(STAFF_DATA, SCHEMAS, TYPES);
    const projection = new TestProjection(fileSystem);
    const records = projection.generate();
    eq(records.length, 2);
    eq(records[0].data.length, 2);
    eq(records[0].data[0].fullName, "John Wayne");
    eq(records[0].data[1].fullName, "John Paul Sartre");
    eq(records[1].data.length, 2);
    eq(records[1].data[0].fullName, "Marrion Robbert Morrison");
    eq(records[1].data[1].fullName, "John Paul Sartre");
  });
});

class TestProjection extends Projection<SourceType, ProjectionType> {
  constructor(fileSystem: FileSystem) {
    super({ name: "staff-full-names", version: "1.0.0", source: "staff", fileSystem });
  }
  _build(people: SourceType[]): ProjectionType[] {
    return people.map((person) => {
      const fullName = person.givenNames.concat(person.surname).join(" ");
      return { fullName };
    });
  }
}

type SourceType = {
  givenNames: string[];
  surname: string;
};

type ProjectionType = {
  fullName: string;
};

class StubFileSystem implements FileSystem {
  private _data: TemporalRecordType[];
  private _types: string;
  private _schemas: SchemasEntryType[];

  constructor(data: TemporalRecordType[], schemas: SchemasEntryType[], types: string) {
    this._data = data;
    this._schemas = schemas;
    this._types = types;
  }
  loadDataSource(source: string): TemporalRecordType[] {
    return this._data;
  }
  loadSchemas(projection: string, versions: string): SchemasEntryType[] {
    return this._schemas;
  }
  loadTypeDefinitions(projection: string): string {
    return this._types;
  }
}

const STAFF_DATA: TemporalRecordType[] = [
  {
    effectiveDate: new Date("2022-01-01T00:00:00Z"),
    data: [
      {
        givenNames: ["John"],
        surname: "Wayne",
      },
      {
        givenNames: ["John", "Paul"],
        surname: "Sartre",
      },
    ],
  },
  {
    effectiveDate: new Date("2021-01-01T00:00:00Z"),
    data: [
      {
        givenNames: ["Marrion", "Robbert"],
        surname: "Morrison",
      },
      {
        givenNames: ["John", "Paul"],
        surname: "Sartre",
      },
    ],
  },
];

const SCHEMAS = [
  {
    version: "1.0.0",
    schema: array().of(
      object()
        .shape({
          fullName: string(),
        })
        .noUnknown(true)
    ),
  },
];

const TYPES = "type foo = string";

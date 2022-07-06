import { strictEqual as eq, throws } from "assert";
import { describe, it } from "zunit";
import { object, array, string } from "yup";
import { FileSystemType } from "../src/FileSystem";
import Projection from "../src/Projection";
import { TemporalRecordType, SchemasEntryType } from "../src";
import Package from "../src/Package";

export default describe("Projection", () => {
  it("should generate temporal records", () => {
    const fileSystem = new StubFileSystem(STAFF_DATA, SCHEMAS, TYPES);
    const projection = new TestProjection({ fileSystem });
    const records = projection.generate();
    eq(records.length, 2);
    eq(records[0].data.length, 2);
    eq(records[0].data[0].fullName, "John Wayne");
    eq(records[0].data[1].fullName, "John Paul Sartre");
    eq(records[1].data.length, 2);
    eq(records[1].data[0].fullName, "Marrion Robert Morrison");
    eq(records[1].data[1].fullName, "John Paul Sartre");
  });

  it("should validate projections@major using matching schema version", () => {
    const schemas = [
      {
        version: "1.0.0",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "1.0.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@major using compatible patch schema", () => {
    const schemas = [
      {
        version: "1.0.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "1.0.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@major using compatible minor schema", () => {
    const schemas = [
      {
        version: "1.0.0",
        schema: array(),
      },
      {
        version: "1.1.0",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "1.0.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@minor using matching schema version", () => {
    const schemas = [
      {
        version: "0.1.0",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.1.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@minor using compatible patch schema", () => {
    const schemas = [
      {
        version: "0.1.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.1.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@patch using matching schema version", () => {
    const schemas = [
      {
        version: "0.0.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.0.1", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should ignore incompatible schemas for projections@major", () => {
    const schemas = [
      {
        version: "2.0.0",
        schema: array(),
      },
      {
        version: "1.0.0",
        schema: array().test(() => false),
      },
      {
        version: "3.0.0",
        schema: array().test(() => false),
      },
    ];

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "2.0.0", fileSystem });

    projection.generate();
  });

  it("should ignore incompatible schemas for projections@minor", () => {
    const schemas = [
      {
        version: "0.2.0",
        schema: array(),
      },
      {
        version: "0.3.0",
        schema: array().test(() => false),
      },
      {
        version: "0.1.0",
        schema: array().test(() => false),
      },
      {
        version: "0.0.1",
        schema: array().test(() => false),
      },
      {
        version: "1.2.0",
        schema: array().test(() => false),
      },
    ];

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.2.0", fileSystem });

    projection.generate();
  });

  it("should ignore incompatible schemas for projections@patch", () => {
    const schemas = [
      {
        version: "0.0.2",
        schema: array(),
      },
      {
        version: "0.0.3",
        schema: array().test(() => false),
      },
      {
        version: "0.0.1",
        schema: array().test(() => false),
      },
    ];

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.0.2", fileSystem });

    projection.generate();
  });

  it("should error when projection@major has no current schema", () => {
    const schemas = [
      {
        version: "2.2.0",
        schema: array(),
      },
      {
        version: "2.0.0",
        schema: array(),
      },
    ];

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "2.1.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.message, "Projection staff-full-names@2.1.0 has no current schema");
        return true;
      }
    );
  });

  it("should error when projection@minor has no current schema", () => {
    const schemas = [
      {
        version: "0.1.0",
        schema: array(),
      },
      {
        version: "0.3.0",
        schema: array(),
      },
    ];

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas, TYPES);
    const projection = new TestProjection({ version: "0.2.0", fileSystem });

    throws(
      () => projection.generate(),
      (err: Error) => {
        eq(err.message, "Projection staff-full-names@0.2.0 has no current schema");
        return true;
      }
    );
  });
});

type TestProjectionOptionsType = {
  version?: string;
  fileSystem: FileSystemType;
};

class TestProjection extends Projection<SourceType, ProjectionType> {
  constructor({ version = "1.0.0", fileSystem }: TestProjectionOptionsType) {
    super("staff-full-names", version, "staff", { fileSystem });
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

class StubFileSystem implements FileSystemType {
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
  loadSchemas(projection: string): SchemasEntryType[] {
    return this._schemas;
  }
  getPackageDir(packageName: string): string {
    throw new Error("Method not implemented.");
  }
  initPackage(packageName: string, packageVersion: string, projectionName: string): void {
    throw new Error("Method not implemented.");
  }
  writeVariant(packageName: string, variantName: string, recors: TemporalRecordType[]): void {
    throw new Error("Method not implemented.");
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
        givenNames: ["Marrion", "Robert"],
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

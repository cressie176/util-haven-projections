import { strictEqual as eq, rejects } from "assert";
import { describe, it } from "zunit";
import { object, array, string } from "yup";
import { TemporalRecordType } from "../src";
import LocalDataSource from "../src/datasources/LocalDataSource";

import StubProjection from "./stubs/StubProjection";
import StubFileSystem from "./stubs/StubFileSystem";

export default describe("Projection", () => {
  it("should generate temporal records", async () => {
    const fileSystem = new StubFileSystem(STAFF_DATA, SCHEMAS);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("1.0.0", dataSource, fileSystem);
    const records = await projection.generate();
    eq(records.length, 2);
    eq(records[0].data.length, 2);
    eq(records[0].data[0].fullName, "John Wayne");
    eq(records[0].data[1].fullName, "John Paul Sartre");
    eq(records[1].data.length, 2);
    eq(records[1].data[0].fullName, "Marrion Robert Morrison");
    eq(records[1].data[1].fullName, "John Paul Sartre");
  });

  it("should validate projections@major using matching schema version", async () => {
    const schemas = [
      {
        version: "1.0.0",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("1.0.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@major using compatible patch schema", async () => {
    const schemas = [
      {
        version: "1.0.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("1.0.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@major using compatible minor schema", async () => {
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
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("1.0.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@minor using matching schema version", async () => {
    const schemas = [
      {
        version: "0.1.0",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.1.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@minor using compatible patch schema", async () => {
    const schemas = [
      {
        version: "0.1.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.1.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should validate projections@patch using matching schema version", async () => {
    const schemas = [
      {
        version: "0.0.1",
        schema: array().test(() => false),
      },
    ];
    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.0.1", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.constructor.name, "ValidationError");
        return true;
      }
    );
  });

  it("should ignore incompatible schemas for projections@major", async () => {
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

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("2.0.0", dataSource, fileSystem);

    await projection.generate();
  });

  it("should ignore incompatible schemas for projections@minor", async () => {
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

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.2.0", dataSource, fileSystem);

    await projection.generate();
  });

  it("should ignore incompatible schemas for projections@patch", async () => {
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

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.0.2", dataSource, fileSystem);

    await projection.generate();
  });

  it("should error when projection@major has no current schema", async () => {
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

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("2.1.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.message, "Projection staff-full-names@2.1.0 has no current schema");
        return true;
      }
    );
  });

  it("should error when projection@minor has no current schema", async () => {
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

    const fileSystem = new StubFileSystem(STAFF_DATA, schemas);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("0.2.0", dataSource, fileSystem);

    await rejects(
      () => projection.generate(),
      (err: Error) => {
        eq(err.message, "Projection staff-full-names@0.2.0 has no current schema");
        return true;
      }
    );
  });
});

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

import { strictEqual as eq, match } from "assert";
import { describe, it } from "zunit";
import { object, array, string } from "yup";
import { TemporalRecordType } from "../src";
import LocalDataSource from "../src/datasources/LocalDataSource";
import StubProjection from "./stubs/StubProjection";
import StubFileSystem from "./stubs/StubFileSystem";
import Package from "../src/Package";

export default describe("Package", () => {
  it("should build the package", async () => {
    const fileSystem = new StubFileSystem(STAFF_DATA, SCHEMAS);
    const dataSource = new LocalDataSource("staff", { fileSystem });
    const projection = new StubProjection("1.0.0", dataSource, fileSystem);
    const pkg = new Package(projection, { fileSystem });

    await pkg.build();

    eq(fileSystem.packages["data-staff-full-names"].name, "data-staff-full-names");
    eq(fileSystem.packages["data-staff-full-names"].version, "1.0.0");
    eq(fileSystem.packages["data-staff-full-names"].variants["all"].records.length, 2);
    match(fileSystem.packages["data-staff-full-names"].variants["all"].script, /require\('\$DATA'\)/m);
    match(fileSystem.packages["data-staff-full-names"].variants["all"].typedef, /from '\$PACKAGE_TYPES'/m);
    eq(fileSystem.packages["data-staff-full-names"].variants["current-and-future"].records.length, 1);
    match(fileSystem.packages["data-staff-full-names"].variants["current-and-future"].script, /require\('\$DATA'\)/m);
    match(fileSystem.packages["data-staff-full-names"].variants["current-and-future"].typedef, /from '\$PACKAGE_TYPES'/m);
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

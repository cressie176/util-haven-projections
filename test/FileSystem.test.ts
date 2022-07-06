import path from "path";
import { strictEqual as eq, match, ok } from "assert";
import { describe, it, beforeEach } from "zunit";
import FileSystem from "../src/FileSystem";

export default describe("Projection", () => {
  let fileSystem: FileSystem;

  beforeEach(() => {
    fileSystem = new FileSystem(path.join(__dirname, "testdata"));
  });

  it("should load data sources", () => {
    const source = fileSystem.loadDataSource("parks");
    eq(source.length, 3);
    eq(source[0].effectiveDate.constructor.name, "Date");
  });

  it("should sort data sources most recent", () => {
    const source = fileSystem.loadDataSource("parks");
    ok(source[0].effectiveDate > source[1].effectiveDate);
    ok(source[1].effectiveDate > source[2].effectiveDate);
  });

  it("should load schemas", () => {
    const schemas = fileSystem.loadSchemas("parks");
    eq(schemas.length, 1);
    eq(schemas[0].version, "1.0.0");
  });

  it("should load type definitions", () => {
    const types = fileSystem.loadTypeDefinitions("parks");
    match(types, /export type ProjectionType/);
  });
});

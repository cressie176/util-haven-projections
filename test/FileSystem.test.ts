import fs from "fs";
import path from "path";
import { strictEqual as eq, match, ok } from "assert";
import { describe, it, beforeEach, afterEach } from "zunit";
import FileSystem from "../src/FileSystem";

const cwd = path.join(__dirname, "testdata");

export default describe("Projection", () => {
  let fileSystem: FileSystem;
  let invalidations: string[] = [];

  beforeEach(() => {
    fileSystem = new FileSystem(cwd);
    fs.rmSync(path.join(cwd, "dist"), { recursive: true, force: true });
  });

  afterEach(() => {
    invalidations.forEach(() => {
      const key = path.join(cwd, "dist", "packages", "data-parks", "package.json");
      delete require.cache[key];
    });
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

  it("should get package directory", () => {
    eq(fileSystem.getPackageDir("data-parks"), path.join(cwd, "dist", "packages", "data-parks"));
  });

  it("should initialise a new package", () => {
    const before = new Date();
    fileSystem.initPackage("data-parks", "1.0.0", "parks");

    const baseDir = fs.statSync(path.join(cwd, "dist", "packages", "data-parks"));
    eq(baseDir.isDirectory(), true);

    const created = baseDir.ctime;
    ok(created >= before);

    const dataDir = fs.statSync(path.join(cwd, "dist", "packages", "data-parks", "data"));
    eq(dataDir.isDirectory(), true);

    const npmrc = fs.statSync(path.join(cwd, "dist", "packages", "data-parks", ".npmrc"));
    eq(npmrc.isFile(), true);

    const typedefs = fs.statSync(path.join(cwd, "dist", "packages", "data-parks", "index.d.ts"));
    eq(typedefs.isFile(), true);

    const pkg = load(path.join(cwd, "dist", "packages", "data-parks", "package.json"));
    eq(pkg.name, "data-parks");
    eq(pkg.version, "1.0.0");
  });

  it("should replace existing packages", () => {
    fileSystem.initPackage("data-parks", "1.0.0", "parks");
    fileSystem.initPackage("data-parks", "1.0.1", "parks");

    const pkg = load(path.join(cwd, "dist", "packages", "data-parks", "package.json"));
    eq(pkg.name, "data-parks");
    eq(pkg.version, "1.0.1");
  });

  it("should write variants", () => {
    fileSystem.initPackage("data-parks", "1.0.0", "parks");
    const records = [
      {
        effectiveDate: new Date("2021-01-01T00:00:00Z"),
        data: [{ fullName: "John Wayne" }],
      },
      {
        effectiveDate: new Date("2020-01-01T00:00:00Z"),
        data: [{ fullName: "Marrion Robert Morrison" }],
      },
    ];
    fileSystem.writeVariant("data-parks", "all", records);

    const projection = load(path.join(cwd, "dist", "packages", "data-parks", "all"));
    const data = projection.get();

    eq(data.length, 1);
    eq(data[0].fullName, "John Wayne");
  });

  it("should honour effective dates", () => {
    fileSystem.initPackage("data-parks", "1.0.0", "parks");
    const records = [
      {
        effectiveDate: new Date("2021-01-01T00:00:00Z"),
        data: [{ fullName: "John Wayne" }],
      },
      {
        effectiveDate: new Date("2020-01-01T00:00:00Z"),
        data: [{ fullName: "Marrion Robert Morrison" }],
      },
    ];
    fileSystem.writeVariant("data-parks", "all", records);

    const projection = load(path.join(cwd, "dist", "packages", "data-parks", "all"));
    const data = projection.get(new Date("2020-06-01T00:00:00Z"));

    eq(data.length, 1);
    eq(data[0].fullName, "Marrion Robert Morrison");
  });

  it("should write variant type definitions", () => {
    fileSystem.initPackage("data-parks", "1.0.0", "parks");
    fileSystem.writeVariant("data-parks", "all", []);

    const typedefs = fs.statSync(path.join(cwd, "dist", "packages", "data-parks", "all.d.ts"));
    eq(typedefs.isFile(), true);
  });

  function load(p: string) {
    invalidations.push(p);
    return require(p);
  }
});

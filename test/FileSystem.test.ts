import fs from "fs";
import path from "path";
import { strictEqual as eq, match, ok } from "assert";
import { describe, it, beforeEach } from "zunit";
import FileSystem from "../src/FileSystem";

const cwd = path.join(__dirname, "testdata");

export default describe("Projection", () => {
  let fileSystem: FileSystem;

  beforeEach(() => {
    fileSystem = new FileSystem(cwd);

    const pkgPath = path.join(cwd, "dist", "packages", "data-parks", "package.json");
    delete require.cache[pkgPath];

    fs.rmSync(path.join(cwd, "dist"), { recursive: true, force: true });
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

    const pkg = require(path.join(cwd, "dist", "packages", "data-parks", "package.json"));
    eq(pkg.name, "data-parks");
    eq(pkg.version, "1.0.0");
  });

  it("should replace existing packages", () => {
    fileSystem.initPackage("data-parks", "1.0.0", "parks");
    fileSystem.initPackage("data-parks", "1.0.1", "parks");

    const pkg = require(path.join(cwd, "dist", "packages", "data-parks", "package.json"));
    eq(pkg.name, "data-parks");
    eq(pkg.version, "1.0.1");
  });
});

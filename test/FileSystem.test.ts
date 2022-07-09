import fs from "fs";
import path from "path";
import { strictEqual as eq, match, ok } from "assert";
import { describe, it, beforeEach, afterEach } from "zunit";
import FileSystem from "../src/FileSystem";

const cwd = path.join(__dirname, "testdata");

export default describe("FileSystem", () => {
  let fileSystem: FileSystem;
  let invalidations: string[] = [];

  beforeEach(() => {
    fileSystem = new FileSystem(cwd);
    fs.rmSync(path.join(cwd, "dist"), { recursive: true, force: true });
  });

  afterEach(() => {
    invalidations.forEach((key) => {
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
    const schemas = fileSystem.loadSchemas("park-opening-dates");
    eq(schemas.length, 2);
    eq(schemas[0].version, "1.0.0");
    eq(schemas[1].version, "1.0.1");
  });

  it("should get package directory", () => {
    eq(fileSystem.getPackageDir("data-park-opening-dates"), path.join(cwd, "dist", "packages", "data-park-opening-dates"));
  });

  it("should initialise a new package", () => {
    const before = new Date();
    fileSystem.initPackage("data-park-opening-dates", "1.0.0");

    const baseDir = statPackageFile();
    eq(baseDir.isDirectory(), true);

    const created = baseDir.ctime;
    ok(created >= before);

    const npmrc = statPackageFile(".npmrc");
    eq(npmrc.isFile(), true);

    const pkg = requirePackageFile("package.json");
    eq(pkg.name, "data-park-opening-dates");
    eq(pkg.version, "1.0.0");
  });

  it("should replace existing packages", () => {
    fileSystem.initPackage("data-park-opening-dates", "1.0.0");
    fileSystem.initPackage("data-park-opening-dates", "1.0.1");

    const pkg = requirePackageFile("package.json");
    eq(pkg.name, "data-park-opening-dates");
    eq(pkg.version, "1.0.1");
  });

  it("should write package types", () => {
    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!\n$PROJECTION_TYPES`;
    fileSystem.initPackage("data-park-opening-dates", "1.0.0");
    fileSystem.writePackageTypes("data-park-opening-dates", "park-opening-dates", typedef);

    const packageScript = readPackageFile("index.d.ts");
    match(packageScript, /export type ProjectionType = ParkOpeningDatesType;/m);
  });

  it("should write variants", () => {
    const records = [
      {
        effectiveDate: new Date("2021-01-01T00:00:00Z"),
        data: [{ fullName: "John Wayne" }],
      },
    ];
    const script = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!\nconst records = require('$DATA');`;
    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!\nimport { ProjectionType } from '$PACKAGE_TYPES';`;

    fileSystem.initPackage("data-park-opening-dates", "1.0.0");
    fileSystem.writeVariant("data-park-opening-dates", "all", records, script, typedef);

    const packageData = requirePackageFile("all", "data.json");
    eq(packageData.length, 1);
    eq(packageData[0].effectiveDate, "2021-01-01T00:00:00.000Z");

    const packageScript = readPackageFile("all", "index.js");
    match(packageScript, /require\('\.\/data\.json'\)/m);

    const packageTypeDef = readPackageFile("all", "index.d.ts");
    match(packageTypeDef, /from '\.\.\/index.d'/m);
  });

  function requirePackageFile(...paths: string[]) {
    const fullPath = getPackagePath(...paths);
    invalidations.push(fullPath);
    return require(fullPath);
  }

  function statPackageFile(...paths: string[]) {
    const fullPath = getPackagePath(...paths);
    return fs.statSync(fullPath);
  }

  function readPackageFile(...paths: string[]) {
    const fullPath = getPackagePath(...paths);
    return fs.readFileSync(fullPath, "utf-8");
  }

  function getPackagePath(...paths: string[]) {
    return path.join(cwd, "dist", "packages", "data-park-opening-dates", ...paths);
  }
});

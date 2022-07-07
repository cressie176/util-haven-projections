import fs from "node:fs";
import path from "node:path";
import { strictEqual as eq } from "assert";
import { describe, it, before, after } from "zunit";
import Package from "../src/Package";
import FileSystem from "../src/FileSystem";
import ParkOpeningDates from "./testdata/projections/park-opening-dates";

const cwd = path.join(__dirname, "testdata");
export default describe("End to End", () => {
  let invalidations: string[] = [];

  before(async () => {
    fs.rmSync(path.join(cwd, "dist"), { recursive: true, force: true });

    const fileSystem = new FileSystem(cwd);
    const projection = new ParkOpeningDates({ fileSystem });
    const pkg = new Package(projection, { fileSystem });

    await pkg.build();
  });

  after(() => {
    invalidations.forEach((key) => {
      delete require.cache[key];
    });
  });

  it("should get current data from all variant", async () => {
    const temporalData = requirePackageFile("all");
    const parkOpeningDates = temporalData.get();

    eq(parkOpeningDates.length, 2);

    eq(parkOpeningDates[0].code, "DC");
    eq(parkOpeningDates[0].openingDates.guests[0].from, "2022-03-11");
    eq(parkOpeningDates[0].openingDates.guests[0].to, "2022-11-07");

    eq(parkOpeningDates[1].code, "SX");
    eq(parkOpeningDates[1].openingDates.guests[0].from, "2022-03-11");
    eq(parkOpeningDates[1].openingDates.guests[0].to, "2022-11-07");
  });

  it("should get historic data from all variant", async () => {
    const temporalData = requirePackageFile("all");
    const parkOpeningDates = temporalData.get(new Date("2021-01-01"));

    eq(parkOpeningDates.length, 2);

    eq(parkOpeningDates[0].code, "DC");
    eq(parkOpeningDates[0].openingDates.guests[0].from, "2021-03-11");
    eq(parkOpeningDates[0].openingDates.guests[0].to, "2021-11-07");

    eq(parkOpeningDates[1].code, "SX");
    eq(parkOpeningDates[1].openingDates.guests[0].from, "2021-03-11");
    eq(parkOpeningDates[1].openingDates.guests[0].to, "2021-11-07");
  });

  //   it("should get current and future data", async () => {
  //       const temporalData = requirePackageFile("current-and-future");
  //       const parkOpeningDates = temporalData.get();

  //       console.log(parkOpeningDates);
  //     },
  //     { exclusive: true }
  //   );

  function requirePackageFile(...paths: string[]) {
    const fullPath = getPackagePath(...paths);
    invalidations.push(fullPath);
    return require(fullPath);
  }

  function getPackagePath(...paths: string[]) {
    return path.join(cwd, "dist", "packages", "data-park-opening-dates", ...paths);
  }
});

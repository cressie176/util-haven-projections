import Debug from "debug";
import { program } from "commander";
import { name, version } from "./package.json";
import Package from "./src/Package";
import * as npm from "./src/repositories/npm";
import ParksDataSource from "./sources/parks";
import ParksProjection from "./projections/parks";
import ParkOpeningDatesProjection from "./projections/park-opening-dates";

const debug = Debug("haven:projections");

program.name(name).version(version).option("--dry-run").option("--scope <scope>").option("--prefix <prefix>");
program.parse().opts();
const { dryRun, scope, prefix } = program.opts();

const parksDataSource = new ParksDataSource();
const projections = [new ParksProjection(parksDataSource), new ParkOpeningDatesProjection(parksDataSource)];

(async () => {
  for (let i = 0; i < projections.length; i++) {
    const projection = projections[i];
    const pkg = new Package(projection, { scope, prefix });
    const isPublished = await npm.isPublished(pkg);
    if (isPublished) {
      debug(`Package ${pkg.fqn} has already been published - skipping`);
      continue;
    }
    await pkg.build();
    await npm.publish(pkg, { dryRun });
  }
})();

import Debug from "debug";
import { name, version } from "./package";
import { program } from "commander";
import Package from "./src/Package";
import * as npm from "./src/repositories/npm";
import Parks from "./projections/parks";
import ParkOpeningDates from "./projections/park-opening-dates";

const debug = Debug("haven:projections");

program.name(name).version(version).option("--dry-run").option("--scope <type>").option("--prefix <type>");

program.parse();

const { dryRun, scope, prefix } = program.opts();

const projections = [new Parks(), new ParkOpeningDates()];

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

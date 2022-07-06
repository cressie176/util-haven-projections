import Debug from "debug";
import Package from "./src/Package";
import * as npm from "./src/npm";
import Parks from "./projections/parks";
import ParkOpeningDates from "./projections/park-opening-dates";

const debug = Debug("haven:projections");
const dryRun = process.argv.includes("--dry-run");

const projections = [new Parks(), new ParkOpeningDates()];

(async () => {
  for (let i = 0; i < projections.length; i++) {
    const projection = projections[i];
    const pkg = new Package(projection);
    if (npm.isPublished(pkg)) {
      debug(`Package ${pkg.fqn} has already been published - skipping`);
      continue;
    }
    await pkg.build();
    npm.publish(pkg, { dryRun });
  }
})();

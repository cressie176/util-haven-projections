import Debug from "debug";
import Package from "./src/Package";
import * as npm from "./src/npm";
import Parks from "./projections/parks";
import ParkOpeningDates from "./projections/park-opening-dates";

const debug = Debug("haven:projections");

const args = process.argv;
const dryRun = args.includes("--dry-run");

[new Parks(), new ParkOpeningDates()].forEach((projection) => {
  const pkg = new Package(projection);
  if (npm.isPublished(pkg)) {
    debug(`Package ${pkg.fqn} has already been published - skipping`);
    return;
  }
  pkg.build();
  npm.publish(pkg, { dryRun });
});

import Debug from "debug";
import Module from "./src/Module";
import Parks from "./projections/parks";
import ParkOpeningDates from "./projections/park-opening-dates";

const debug = Debug("haven:projections");

const args = process.argv;
const dryRun = args.includes("--dry-run");

[new Parks(), new ParkOpeningDates()].forEach((projection) => {
  const module = new Module(projection);
  if (module.isPublished()) {
    debug(`Module ${module.fqn} has already been published - skipping`);
    return;
  }
  module.generate();
  module.publish({ dryRun });
});

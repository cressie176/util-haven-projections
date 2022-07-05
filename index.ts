import Module from "./src/Module";
import Parks from "./projections/parks";
import ParkOpeningDates from "./projections/park-opening-dates";

const args = process.argv;
const dryRun = args.includes("--dry-run");

[new Parks(), new ParkOpeningDates()]
  .filter((projection) => {
    return !projection.isPublished();
  })
  .forEach((projection) => {
    const module = new Module(projection.generate());
    module.write();
    module.publish({ dryRun });
  });

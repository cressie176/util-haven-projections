import { Suite } from "zunit";
import ProjectionTests from "./Projection.test";
import PackageTests from "./Package.test";
import FileSystemTests from "./FileSystem.test";
import e2eTests from "./e2e.test";

const suite = new Suite("All Tests").add(ProjectionTests, PackageTests, FileSystemTests, e2eTests);

export default suite;

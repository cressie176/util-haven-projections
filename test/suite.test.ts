import { Suite } from "zunit";
import ProjectionTests from "./Projection.test";
import PackageTests from "./Package.test";
import FileSystemTests from "./FileSystem.test";

const suite = new Suite("All Tests").add(ProjectionTests, PackageTests, FileSystemTests);

export default suite;

import { Suite } from "zunit";
import ProjectionTests from "./Projection.test";
import FileSystemTests from "./FileSystem.test";

const suite = new Suite("All Tests").add(ProjectionTests, FileSystemTests);

export default suite;

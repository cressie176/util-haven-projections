import { FileSystemType } from "../../../../src";
import LocalDataSource from "../../../../src/datasources/LocalDataSource";

export default (fileSystem: FileSystemType) => new LocalDataSource("parks", { fileSystem });

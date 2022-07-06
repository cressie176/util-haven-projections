import { DataSourceType, TemporalRecordType } from "..";
import FileSystem, { FileSystemType } from "../FileSystem";

type LocalDataSourceOptionsType = {
  fileSystem?: FileSystemType;
};

export default class LocalDataSource implements DataSourceType {
  private _name: string;
  private _fileSystem: FileSystemType;

  constructor(name: string, options: LocalDataSourceOptionsType = {}) {
    this._name = name;
    this._fileSystem = options.fileSystem || new FileSystem();
  }

  async fetch(): Promise<TemporalRecordType[]> {
    return this._fileSystem.loadDataSource(this._name);
  }
}

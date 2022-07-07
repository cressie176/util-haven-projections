import { DataSourceType, FileSystemType, TemporalRecordType } from "..";
import FileSystem from "../FileSystem";

export type LocalDataSourceOptionsType = {
  fileSystem?: FileSystemType;
};

export default class LocalDataSource<T> implements DataSourceType<T> {
  private _name: string;
  private _fileSystem: FileSystemType;

  constructor(name: string, options: LocalDataSourceOptionsType = {}) {
    this._name = name;
    this._fileSystem = options.fileSystem || new FileSystem();
  }

  async fetch(): Promise<TemporalRecordType<T>[]> {
    return this._fileSystem.loadDataSource(this._name);
  }
}

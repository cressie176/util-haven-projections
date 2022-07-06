import Debug from "debug";
import { TemporalRecordType } from ".";
import Projection from "./Projection";
import FileSystem, { FileSystemType } from "./FileSystem";

const debug = Debug("haven:projections:Package");

type PackageOptionsType = {
  fileSystem?: FileSystemType;
};

export default class Package {
  private _name: string;
  private _projection: any;
  private _fileSystem: FileSystemType;

  constructor(projection: Projection<any, any>, options: PackageOptionsType = {}) {
    this._name = `data-${projection.name}`;
    this._projection = projection;
    this._fileSystem = options.fileSystem ? options.fileSystem : new FileSystem();
  }

  get name() {
    return this._name;
  }

  get version() {
    return this._projection.version;
  }

  get fqn() {
    return `${this._name}@${this.version}`;
  }

  get projectionName() {
    return this._projection.name;
  }

  get baseDir() {
    return this._fileSystem.getPackageDir(this.name);
  }

  build() {
    const records = this._projection.generate();
    this._write(records);
  }

  private _write(records: TemporalRecordType[]) {
    debug(`Writing package ${this.fqn}`);
    this._fileSystem.initPackage(this);
    this._fileSystem.writeVariant(this.name, "all", records);
    this._fileSystem.writeVariant(this.name, "currentAndFuture", this._getCurrentAndFutureRecords(records));
  }

  private _getCurrentAndFutureRecords(records: TemporalRecordType[]) {
    const now = new Date();
    const startDate = records
      .map(({ effectiveDate }) => effectiveDate)
      .reduce((winner, candidate) => {
        if (!winner) return candidate;
        if (candidate > winner && candidate <= now) return candidate;
        if (candidate < winner && candidate >= now) return candidate;
        return winner;
      });
    return records.filter(({ effectiveDate }) => effectiveDate >= startDate);
  }
}

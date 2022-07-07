import Debug from "debug";
import { FileSystemType, TemporalRecordType } from ".";
import Projection from "./Projection";
import FileSystem from "./FileSystem";

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
    this._fileSystem = options.fileSystem || new FileSystem();
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

  async build() {
    const records = await this._projection.generate();
    this._write(records);
  }

  private _write(records: TemporalRecordType[]) {
    debug(`Writing package ${this.fqn}`);
    this._fileSystem.initPackage(this.name, this.version, this.projectionName);
    this._writeVariant("all", records);
    this._writeVariant("current-and-future", this._getCurrentAndFutureRecords(records));
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

  private _writeVariant(variantName: string, records: TemporalRecordType[]) {
    const script = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
const records = require('$DATA');
module.exports = {
  get(effectiveDate = Date.now()) {
    const record = records.find((candidate) => new Date(candidate.effectiveDate) <= effectiveDate);
    return record ? record.data : null;
  }
}`;

    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
import { ProjectionType } from '$PACKAGE_TYPE_DEFINITIONS';
export function get(effectiveDate? : Date): ProjectionType[];
`;

    this._fileSystem.writeVariant(this.name, variantName, records, script, typedef);
  }
}

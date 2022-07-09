import Debug from "debug";
import { FileSystemType, TemporalRecordType } from ".";
import Projection from "./Projection";
import FileSystem from "./FileSystem";

const debug = Debug("haven:projections:Package");

type PackageOptionsType = {
  scope?: string;
  prefix?: string;
  fileSystem?: FileSystemType;
};

export default class Package {
  private _scope: string;
  private _name: string;
  private _projection: Projection<any, any>;
  private _fileSystem: FileSystemType;

  constructor(projection: Projection<any, any>, options: PackageOptionsType = {}) {
    this._name = [options.scope ? `${options.scope}/` : "", options.prefix ? `${options.prefix}-` : "", projection.name].join("");
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
    return `@${this._scope}/{this._name}@${this.version}`;
  }

  get projectionName() {
    return this._projection.name;
  }

  get baseDir() {
    return this._fileSystem.getPackageDir(this.name);
  }

  async build() {
    debug(`Building package ${this.fqn}`);
    const records = await this._projection.generate();
    this._fileSystem.initPackage(this.name, this.version);
    this._writePackageTypes();
    this._writeVariant("all", records);
    this._writeVariant("current-and-future", this._getCurrentAndFutureRecords(records));
  }

  private _getCurrentAndFutureRecords(records: TemporalRecordType<any>[]) {
    const now = new Date();
    const startDate = records
      .map(({ effectiveDate }) => effectiveDate)
      .reduce((winner, candidate) => {
        if (winner >= now) return candidate;
        return winner;
      });

    return records.filter(({ effectiveDate }) => effectiveDate >= startDate);
  }

  private _writePackageTypes() {
    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
    
export type ProjectedRecordType = {
  name: string,
  version: string,
  variant: string,
  effectiveDate: Date | null;
  nextEffectiveDate: Date | null;
  data: Array<ProjectionType>;
};

$PROJECTION_TYPES
`;

    this._fileSystem.writePackageTypes(this.name, this.projectionName, typedef);
  }

  private _writeVariant(variantName: string, records: TemporalRecordType<any>[]) {
    const script = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
const { name, version } = require("../package.json");
const records = require("$DATA");

module.exports = {
  get(date = Date.now()) {    
    const result = { name, version, variant: "${variantName}", effectiveDate: null, nextEffectiveDate: null, data: [] };
    const record = records.find(({ effectiveDate }) => new Date(effectiveDate) <= date);
    if (!record) {
      const nextEffectiveDate = records[records.length-1] ? new Date(records[records.length-1].effectiveDate) : null;
      Object.assign(result, { nextEffectiveDate });
    } else {
      const effectiveDate = record.effectiveDate ? new Date(record.effectiveDate) : null;
      const nextEffectiveDate =
        records
          .map(({ effectiveDate }) => new Date(effectiveDate))
          .sort((a, b) => a - b)
          .find((effectiveDate) => !record || effectiveDate > new Date(record.effectiveDate)) || null;
      Object.assign(result, { effectiveDate, nextEffectiveDate, data: record.data });
    }
    return result;
  }
}`;

    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
import { ProjectionType } from "$PACKAGE_TYPES";
export function get(effectiveDate? : Date): ProjectedRecordType;
`;

    this._fileSystem.writeVariant(this.name, variantName, records, script, typedef);
  }
}

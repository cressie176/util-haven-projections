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
    this._fileSystem.initPackage(this.name, this.version, this.projectionName);
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

  private _writeVariant(variantName: string, records: TemporalRecordType<any>[]) {
    const script = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
const { name, version } = require("../package.json");    
const records = require("$DATA");
module.exports = {
  get(effectiveDate = Date.now()) {
    const record = records.find((candidate) => new Date(candidate.effectiveDate) <= effectiveDate);
    return Object.assign({ name, version, variant: "${variantName}", effectiveDate: null, data: [] }, record);
  }
}`;

    const typedef = `// !!! THIS FILE IS GENERATED. DO NOT EDIT !!!
import { ProjectionType } from "$PACKAGE_TYPES";

export type ProjectedRecordType = {
  name: string,
  version: string,
  variant: string,
  effectiveDate: Date | null;
  data: Array<ProjectionType>;
};

export function get(effectiveDate? : Date): ProjectedRecordType;
`;

    this._fileSystem.writeVariant(this.name, variantName, records, script, typedef);
  }
}

import Debug from "debug";
import * as npm from "./npm";
import fs from "fs";
import path from "path";
import { TemporalRecordType } from ".";
import Projection from "./Projection";
import FileSystem, { FileSystemType } from "./FileSystem";

const debug = Debug("haven:projections:Package");

type PackageOptionsType = {
  projection: Projection<any, any>;
  fileSystem?: FileSystemType;
};

export default class Package {
  private _name: string;
  private _version: string;
  private _baseDir: string;
  private _projection: any;
  private _fileSystem: FileSystemType;

  constructor({ projection, fileSystem = new FileSystem() }: PackageOptionsType) {
    this._name = `data-${projection.name}`;
    this._version = projection.version;
    this._projection = projection;
    this._fileSystem = fileSystem;
    this._baseDir = path.join(process.cwd(), "dist", "packages", this._name);
  }

  get name() {
    return this._name;
  }

  get version() {
    return this._version;
  }

  get fqn() {
    return `${this._name}@${this.version}`;
  }

  generate() {
    const records = this._projection.generate();
    this._write(records);
  }

  private _write(records: TemporalRecordType[]) {
    debug(`Writing package ${this.fqn} to ${this._baseDir}`);
    this._fileSystem.initPackage(this._projection, this);
    this._writeVariant("all", records);
    this._writeVariant("currentAndFuture", this._getCurrentAndFutureRecords(records));
  }

  isPublished(): boolean {
    return npm.isPublished({ pkg: this._name, version: this._version });
  }

  publish({ dryRun = false }: { dryRun: boolean }) {
    debug(`Publishing package ${this.fqn} from ${this._baseDir} with dryRun=${dryRun}`);
    npm.publish({ cwd: this._baseDir, dryRun });
  }

  link() {
    debug(`Linking package ${this.fqn} from ${this._baseDir}`);
    npm.publish({ cwd: this._baseDir, dryRun: true });
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
    const variantPath = path.join(this._baseDir, "data", `${variantName}.json`);

    this._writeJsonSync(variantPath, records);

    const requirePath = `.${path.sep}${path.relative(this._baseDir, variantPath)}`;
    const script = [
      `const records = require('${requirePath}');`,
      `module.exports = {`,
      `  get(effectiveDate = Date.now()) {`,
      `    const record = records.find((candidate) => new Date(candidate.effectiveDate) <= effectiveDate);`,
      `    return record ? record.data : null;`,
      `  }`,
      `}`,
    ].join("\n");

    fs.writeFileSync(path.join(this._baseDir, `${variantName}.js`), script, "utf-8");

    const typeDef = [`import { ProjectionType } from './types';`, `export function get(effectiveDate? : Date): ProjectionType[];`].join("\n");

    fs.writeFileSync(path.join(this._baseDir, `${variantName}.d.ts`), typeDef, "utf-8");
  }

  private _writeJsonSync(fullPath: string, obj: any) {
    const contents = JSON.stringify(obj, null, 2);
    fs.writeFileSync(fullPath, contents, "utf-8");
  }
}

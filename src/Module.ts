import Debug from "debug";
import * as npm from "./npm";
import fs from "fs";
import path from "path";
import { TemporalProjectionType, TemporalRecordType } from "./Projection";

const debug = Debug("haven:Module");

export default class Module {
  private _name: string;
  private _version: string;
  private _types: string;
  private _records: TemporalRecordType[];

  private _baseDir: string;
  constructor(projection: TemporalProjectionType) {
    this._name = projection.name;
    this._version = projection.version;
    this._records = projection.records;
    this._types = projection.types;
    this._baseDir = path.join(process.cwd(), "modules", this._name);
  }

  write() {
    debug(`Writing module ${this._name}@${this._version} to ${this._baseDir}`);
    this._init();
    this._writeVariant("all", this._records);
    this._writeVariant("currentAndFuture", this._getCurrentAndFutureRecords());
  }

  publish({ dryRun = false }: { dryRun: boolean }) {
    debug(
      `Publishing module ${this._name}@${this._version} from ${this._baseDir} with dryRun=${dryRun}`
    );
    npm.publish({ cwd: this._baseDir, dryRun });
  }

  link() {
    debug(
      `Linking module ${this._name}@${this._version} from ${this._baseDir}`
    );
    npm.publish({ cwd: this._baseDir, dryRun: true });
  }

  _init() {
    fs.mkdirSync(path.join(this._baseDir, "data"), { recursive: true });
    const pkg = { name: this._name, version: this._version, private: true };
    const pkgPath = path.join(this._baseDir, "package.json");
    this._writeJsonSync(pkgPath, pkg);

    fs.writeFileSync(
      path.join(this._baseDir, `types.d.ts`),
      this._types,
      "utf-8"
    );
  }

  _getCurrentAndFutureRecords() {
    const now = new Date();
    const startDate = this._records
      .map(({ effectiveDate }) => effectiveDate)
      .reduce((winner, candidate) => {
        if (!winner) return candidate;
        if (candidate > winner && candidate <= now) return candidate;
        if (candidate < winner && candidate >= now) return candidate;
        return winner;
      });
    return this._records.filter(
      ({ effectiveDate }) => effectiveDate >= startDate
    );
  }

  _writeVariant(variantName: string, records: TemporalRecordType[]) {
    const variantPath = path.join(this._baseDir, "data", `${variantName}.json`);

    this._writeJsonSync(variantPath, records);

    const requirePath = `.${path.sep}${path.relative(
      this._baseDir,
      variantPath
    )}`;
    const script = [
      `const records = require('${requirePath}');`,
      `module.exports = {`,
      `  get(effectiveDate = Date.now()) {`,
      `    const record = records.find((candidate) => new Date(candidate.effectiveDate) <= effectiveDate);`,
      `    return record ? record.data : null;`,
      `  }`,
      `}`,
    ].join("\n");

    fs.writeFileSync(
      path.join(this._baseDir, `${variantName}.js`),
      script,
      "utf-8"
    );

    const typeDef = [
      `import { ProjectionType } from './types';`,
      `export function get(effectiveDate? : Date): ProjectionType[];`,
    ].join("\n");

    fs.writeFileSync(
      path.join(this._baseDir, `${variantName}.d.ts`),
      typeDef,
      "utf-8"
    );
  }

  _writeJsonSync(fullPath: string, obj: any) {
    const contents = JSON.stringify(obj, null, 2);
    fs.writeFileSync(fullPath, contents, "utf-8");
  }
}

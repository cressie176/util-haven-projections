import Debug from "debug";
import fs from "fs";
import path from "path";
import { TemporalRecordType, SchemasEntryType } from ".";
import Package from "./Package";
import Projection from "./Projection";

const debug = Debug("haven:projections:FileSystem");

export type FileSystemType = {
  loadDataSource(sourceName: string): TemporalRecordType[];
  loadSchemas(projectionName: string): SchemasEntryType[];
  getPackageDir(packageName: string): string;
  initPackage(packageName: string, packageVersion: string, projectionName: string): void;
  writeVariant(packageName: string, variantName: string, recors: TemporalRecordType[]): void;
};

export default class FileSystem implements FileSystemType {
  private _baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this._baseDir = baseDir;
  }

  loadDataSource(sourceName: string) {
    const dataSourceDir = this._sourceDir(sourceName);
    const pattern = new RegExp(`^${sourceName}-\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z.json$`, "i");
    debug(`Loading data source from ${dataSourceDir} matching ${pattern}`);

    return fs
      .readdirSync(dataSourceDir)
      .filter((filename) => {
        return pattern.test(filename);
      })
      .map((filename) => {
        const fullPath = path.join(dataSourceDir, filename);
        const contents = fs.readFileSync(fullPath, "utf-8");
        const temporalData = JSON.parse(contents);
        return {
          ...temporalData,
          effectiveDate: new Date(temporalData.effectiveDate),
        };
      })
      .sort((a, b) => {
        return b.effectiveDate - a.effectiveDate;
      });
  }

  loadSchemas(projectionName: string): SchemasEntryType[] {
    const schemasDir = this._projectionDir(projectionName, "schemas");
    debug(`Loading schemas from: ${schemasDir}`);
    return fs
      .readdirSync(schemasDir)
      .map((filename) => {
        return path.basename(filename, path.extname(filename));
      })
      .map((version) => {
        const fullPath = path.join(schemasDir, version);
        const { default: schema } = require(fullPath);
        return { version, schema };
      });
  }

  getPackageDir(packageName: string): string {
    return this._packageDir(packageName);
  }

  initPackage(packageName: string, packageVersion: string, projectionName: string) {
    const projectionDir = this._projectionDir(projectionName);
    const packageDir = this._packageDir(packageName);

    debug(`Removing ${packageDir}`);
    fs.rmSync(packageDir, { recursive: true, force: true });

    debug(`Creating directory structure below ${packageDir}`);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(path.join(packageDir, "data"));

    debug(`Writing package.json`);
    writeJson(path.join(packageDir, "package.json"), { name: packageName, version: packageVersion });

    debug(`Copying type index.d.ts`);
    fs.copyFileSync(path.join(projectionDir, "index.d.ts"), path.join(packageDir, "index.d.ts"));

    debug(`Copying .npmrc`);
    fs.copyFileSync(path.join(this._baseDir, ".npmrc"), path.join(packageDir, ".npmrc"));
  }

  writeVariant(packageName: string, variantName: string, records: TemporalRecordType[]) {
    debug(`Writing variant: ${variantName}`);
    this._writeVariantRecords(packageName, variantName, records);
    this._writeVariantScript(packageName, variantName);
    this._writeVariantTypeDefintions(packageName, variantName);
  }

  _writeVariantRecords(packageName: string, variantName: string, records: TemporalRecordType[]) {
    const variantDataPath = this._variantDataPath(packageName, variantName);
    writeJson(variantDataPath, records);
  }

  _writeVariantScript(packageName: string, variantName: string) {
    const variantDataPath = this._variantDataPath(packageName, variantName);
    const requirePath = path.relative(this._packageDir(packageName), variantDataPath);
    const script = `const records = require('.${path.sep}${requirePath}');
      module.exports = {
        get(effectiveDate = Date.now()) {
          const record = records.find((candidate) => new Date(candidate.effectiveDate) <= effectiveDate);
          return record ? record.data : null;
        }
      }`;

    writeFile(this._packageDir(packageName, `${variantName}.js`), script);
  }

  _writeVariantTypeDefintions(packageName: string, variantName: string) {
    const typedef = `import { ProjectionType } from './types';
      export function get(effectiveDate? : Date): ProjectionType[];`;

    const variantTypesPath = this._packageDir(packageName, `${variantName}.d.ts`);
    writeFile(variantTypesPath, typedef);
  }

  _sourceDir(name: string, ...paths: string[]) {
    return path.join(this._baseDir, "sources", name, ...paths);
  }

  _projectionDir(name: string, ...paths: string[]) {
    return path.join(this._baseDir, "projections", name, ...paths);
  }

  _packageDir(name: string, ...paths: string[]) {
    return path.join(this._baseDir, "dist", "packages", name, ...paths);
  }

  _variantDataPath(packageName: string, variantName: string) {
    return this._packageDir(packageName, "data", `${variantName}.json`);
  }
}

function writeJson(fullPath: string, document: any) {
  const contents = JSON.stringify(document, null, 2);
  writeFile(fullPath, contents);
}

function writeFile(fullPath: string, contents: string) {
  fs.writeFileSync(fullPath, contents, "utf-8");
}

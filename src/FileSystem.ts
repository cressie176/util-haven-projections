import Debug from "debug";
import fs from "fs";
import path from "path";
import { TemporalRecordType, SchemasEntryType } from ".";
import Package from "./Package";
import Projection from "./Projection";

const debug = Debug("haven:projections:FileSystem");

export type FileSystemType = {
  loadDataSource(source: string): TemporalRecordType[];
  loadSchemas(projection: string): SchemasEntryType[];
  initPackage(projection: Projection<any, any>, pkg: Package): void;
};

export default class FileSystem implements FileSystemType {
  private _baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this._baseDir = baseDir;
  }

  loadDataSource(source: string) {
    const dataSourceDir = this._sourceDir(source);
    const pattern = new RegExp(`^${source}-\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z.json$`, "i");
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

  loadSchemas(projection: string): SchemasEntryType[] {
    const schemasDir = this._projectionDir(projection, "schemas");
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

  initPackage(projection: Projection<any, any>, pkg: Package) {
    const packageDir = this._packageDir(pkg.name);
    const projectionDir = this._projectionDir(projection.name);

    fs.rmSync(packageDir, { recursive: true, force: true });
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(path.join(packageDir, "data"));
    writeJsonSync(path.join(packageDir, "package.json"), { name: pkg.name, version: pkg.version });

    fs.copyFileSync(path.join(projectionDir, "index.d.ts"), path.join(packageDir, "index.d.ts"));

    fs.copyFileSync(path.join(this._baseDir, ".npmrc"), path.join(packageDir, ".npmrc"));
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
}

function writeJsonSync(fullPath: string, document: any) {
  const contents = JSON.stringify(document, null, 2);
  fs.writeFileSync(fullPath, contents, "utf-8");
}

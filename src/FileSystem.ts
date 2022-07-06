import Debug from "debug";
import fs from "fs";
import path from "path";
import { TemporalRecordType, SchemasEntryType } from ".";

const debug = Debug("haven:projections:FileSystem");

export type FileSystemType = {
  loadDataSource(source: string): TemporalRecordType[];
  loadSchemas(projection: string): SchemasEntryType[];
  loadTypeDefinitions(projection: string): string;
};

export default class FileSystem implements FileSystemType {
  private _baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this._baseDir = baseDir;
  }

  loadDataSource(source: string) {
    const dataSourceDir = this._sourcesDir(source);
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

  loadTypeDefinitions(projection: string): string {
    const typesPath = this._projectionDir(projection, "index.d.ts");
    debug(`Loading type definitions from ${typesPath}`);

    return fs.readFileSync(this._projectionDir(projection, "index.d.ts"), "utf-8");
  }

  _projectionDir(projection: string, ...paths: string[]) {
    return path.join(this._baseDir, "projections", projection, ...paths);
  }

  _sourcesDir(source: string, ...paths: string[]) {
    return path.join(this._baseDir, "sources", source, ...paths);
  }
}

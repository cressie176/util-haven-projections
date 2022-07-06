import Debug from "debug";
import fs from "fs";
import path from "path";
import semver from "semver";
import { TemporalRecordType, SchemasEntryType } from ".";

const debug = Debug("haven:projections:FileSystem");

export type FileSystemType = {
  loadDataSource(source: string): TemporalRecordType[];
  loadSchemas(projection: string, versions: string): SchemasEntryType[];
  loadTypeDefinitions(projection: string): string;
};

export default class FileSystem implements FileSystemType {
  loadDataSource(source: string) {
    const dataSourceDir = sourcesDir(source);
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

  loadSchemas(projection: string, versions: string): SchemasEntryType[] {
    const schemasDir = projectionDir(projection, "schemas");
    debug(`Loading schemas from: ${schemasDir}`);
    return fs
      .readdirSync(schemasDir)
      .map((filename) => {
        return path.basename(filename, path.extname(filename));
      })
      .filter((version) => {
        return semver.satisfies(version, versions);
      })
      .map((version) => {
        const fullPath = path.join(schemasDir, version);
        const { default: schema } = require(fullPath);
        return { version, schema };
      });
  }

  loadTypeDefinitions(projection: string): string {
    const typesPath = projectionDir(projection, "index.d.ts");
    debug(`Loading type definitions from ${typesPath}`);

    return fs.readFileSync(projectionDir(projection, "index.d.ts"), "utf-8");
  }
}

function projectionDir(projection: string, ...paths: string[]) {
  return path.join(process.cwd(), "projections", projection, ...paths);
}

function sourcesDir(source: string, ...paths: string[]) {
  return path.join(process.cwd(), "sources", source, ...paths);
}

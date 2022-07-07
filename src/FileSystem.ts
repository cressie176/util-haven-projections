import Debug from "debug";
import fs from "fs";
import path from "path";
import { TemporalRecordType, SchemasEntryType, FileSystemType } from ".";

const debug = Debug("haven:projections:FileSystem");

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

    debug("Writing package.json");
    writeJson(path.join(packageDir, "package.json"), { name: packageName, version: packageVersion });

    debug("Copying index.d.ts");
    fs.copyFileSync(path.join(projectionDir, "index.d.ts"), path.join(packageDir, "index.d.ts"));

    debug("Copying .npmrc");
    fs.copyFileSync(path.join(this._baseDir, ".npmrc"), path.join(packageDir, ".npmrc"));
  }

  writeVariant(packageName: string, variantName: string, records: TemporalRecordType[], script: string, typedef: string) {
    debug(`Writing variant: ${variantName}`);
    const variantDir = this._variantDir(packageName, variantName);

    fs.mkdirSync(variantDir);
    writeJson(path.join(variantDir, "data.json"), records);
    writeFile(path.join(variantDir, "index.js"), script.replace("$DATA", "./data.json"));
    writeFile(path.join(variantDir, "index.d.ts"), typedef.replace("$PACKAGE_TYPES", "../index.d"));
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

  _variantDir(packageName: string, variantName: string, ...paths: string[]) {
    return this._packageDir(packageName, variantName, ...paths);
  }
}

function writeJson(fullPath: string, document: any) {
  const contents = JSON.stringify(document, null, 2);
  writeFile(fullPath, contents);
}

function writeFile(fullPath: string, contents: string) {
  fs.writeFileSync(fullPath, contents, "utf-8");
}

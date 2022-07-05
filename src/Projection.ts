import Debug from "debug";
import path from "path";
import fs from "fs";
import semver from "semver";
import { object, date, array, AnySchema } from "yup";
import { TemporalRecordType } from ".";

const debug = Debug("haven:projections:Projection");

const ENVELOPE_SCHEMA = array()
  .min(1)
  .of(
    object()
      .shape({
        effectiveDate: date().required(),
        data: array().required(),
      })
      .noUnknown(true)
  );

export type ProjectionOptionsType = {
  baseDir: string;
  version: string;
  source: string;
};

type SchemasEntryType = { version: string; schema: AnySchema };

export default abstract class Projection<SourceType, ProjectionType> {
  private _name: string;
  private _baseDir: string;
  private _version: string;
  private _source: TemporalRecordType[];
  private _schemas: SchemasEntryType[];
  private _types: string;

  constructor({ baseDir, version, source }: ProjectionOptionsType) {
    this._name = path.basename(baseDir);
    this._baseDir = baseDir;
    this._version = version;
    this._source = this._loadSource(source);
    this._schemas = this._loadSchemas();
    this._types = this._loadTypes();
  }

  get name() {
    return this._name;
  }

  get version() {
    return this._version;
  }

  get types() {
    return this._types;
  }

  generate(): TemporalRecordType[] {
    debug(`Generating projection: ${this._name}@${this._version}`);
    const records = this._source.map(({ effectiveDate, data }) => {
      return { effectiveDate, data: this._build(data) };
    });

    this._validate(records);

    return records;
  }

  abstract _build(source: SourceType[]): ProjectionType[];

  private _loadSource(source: string) {
    const sourceDir = path.join(process.cwd(), "sources", source);
    const sourceFilePattern = new RegExp(
      `^${source}-\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z.json$`,
      "i"
    );
    return fs
      .readdirSync(sourceDir)
      .filter((filename) => {
        return sourceFilePattern.test(filename);
      })
      .map((filename) => {
        const fullPath = path.join(sourceDir, filename);
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

  private _loadSchemas(): SchemasEntryType[] {
    const versionRange = this._getCompatibleSchemaVersionRange();
    const schemaDir = path.join(this._baseDir, "schemas");
    return fs
      .readdirSync(schemaDir)
      .map((filename) => {
        return path.basename(filename, path.extname(filename));
      })
      .filter((version) => {
        return semver.satisfies(version, versionRange);
      })
      .map((version) => {
        const fullPath = path.join(schemaDir, version);
        const { default: schema } = require(fullPath);
        return { version, schema };
      });
  }

  private _loadTypes(): string {
    const typesPath = path.join(this._baseDir, "types.d.ts");
    return fs.readFileSync(typesPath, "utf-8");
  }

  private _getCompatibleSchemaVersionRange() {
    const { major, minor } = semver.parse(this._version);
    if (major > 0) return `${major}.0.0 - ${this._version}`;
    if (minor > 0) return `0.${minor}.0 - ${this._version}`;
    return `0.0.0 - ${this._version}`;
  }

  private _validate(records: TemporalRecordType[]) {
    debug(`Validating projection: ${this._name}@${this._version}`);
    this._validateEnvelope(records);
    this._validateData(records);
  }

  private _validateEnvelope(records: TemporalRecordType[]) {
    ENVELOPE_SCHEMA.validateSync(records);
  }

  private _validateData(records: TemporalRecordType[]) {
    if (this._schemas.length === 0)
      throw new Error(
        `Projection ${this._name}@${this._version} has no schema`
      );

    this._schemas.forEach(({ version, schema }) => {
      records.forEach((record) => {
        debug(
          `Validating data for ${this._name}/${record.effectiveDate} using schema ${version}`
        );
        schema.validateSync(record.data, { strict: true, abortEarly: true });
      });
    });
  }
}

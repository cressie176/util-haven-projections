import Debug from "debug";
import semver from "semver";
import { object, date, array } from "yup";
import { TemporalRecordType, SchemasEntryType } from ".";
import FileSystem, { FileSystemType } from "./FileSystem";

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
  name: string;
  version: string;
  source: string;
  fileSystem?: FileSystemType;
};

export default abstract class Projection<SourceType, ProjectionType> {
  private _name: string;
  private _version: string;
  private _source: TemporalRecordType[];
  private _schemas: SchemasEntryType[];
  private _types: string;

  constructor({ name, version, source, fileSystem = new FileSystem() }: ProjectionOptionsType) {
    this._name = name;
    this._version = version;
    this._source = fileSystem.loadDataSource(source);
    this._schemas = fileSystem.loadSchemas(this._name);
    this._types = fileSystem.loadTypeDefinitions(this._name);
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

  private _getCompatibleSchemaVersionRange() {
    const { major, minor } = semver.parse(this._version);
    if (major > 0) return `${major}.x`;
    if (minor > 0) return `0.${minor}.x`;
    return this._version;
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
    const schemas = this._getCompatibleSchemas();
    if (!this._hasCurrentSchema(schemas)) throw new Error(`Projection ${this.name}@${this.version} has no current schema`);

    schemas.forEach(({ version, schema }) => {
      records.forEach((record) => {
        debug(`Validating data for ${this._name}/${record.effectiveDate} using schema ${version}`);
        schema.validateSync(record.data, { strict: true, abortEarly: true });
      });
    });
  }

  private _getCompatibleSchemas() {
    const range = this._getCompatibleSchemaVersionRange();
    return this._schemas.filter(({ version }) => {
      const compatible = semver.satisfies(version, range);
      if (!compatible) debug(`Ignoring schema ${version} as it is incompatible with ${range} range`);
      return compatible;
    });
  }

  private _hasCurrentSchema(schemas: SchemasEntryType[]): boolean {
    const { major, minor } = semver.parse(this._version);
    return Boolean(
      schemas.find(({ version }) => {
        const { major: major2, minor: minor2 } = semver.parse(version);
        return major === major2 && minor === minor2;
      })
    );
  }
}

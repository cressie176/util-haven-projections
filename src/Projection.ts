import Debug from "debug";
import semver from "semver";
import { object, date, array } from "yup";
import { TemporalRecordType, SchemasEntryType } from ".";
import FileSystem from "./FileSystem";

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
  fileSystem?: FileSystem;
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
    this._schemas = fileSystem.loadSchemas(this._name, this._getCompatibleSchemaVersionRange());
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
    if (this._schemas.length === 0) throw new Error(`Projection ${this._name}@${this._version} has no schema`);

    this._schemas.forEach(({ version, schema }) => {
      records.forEach((record) => {
        debug(`Validating data for ${this._name}/${record.effectiveDate} using schema ${version}`);
        schema.validateSync(record.data, { strict: true, abortEarly: true });
      });
    });
  }
}

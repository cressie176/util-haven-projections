# Haven Projections

## Contents

- [The Problem](#the-problem)
- [This Solution](#this-solution)
- [Usage](#usage)
  - [Adding Data Sources](#adding-data-sources)
  - [Adding Projections](#adding-projections)
  - [Updating Data Sources](#updating-data-sources)
  - [Updating Projections](#updating-projections)
- [Local Testing](#local-testing-1)
- [F.A.Q](#faq)
  - [Why not GraphQL?](#why-not-graphQL)
  - [Why not REST?](#why-not-rest)
  - [Why not a database?](#why-not-a-database)
- [TODO](#todo)

## The Problem

Haven has some common, slow moving, discete, reference data such as park addresses, opening times and other attributes such as whether they are dog friendly, etc. This reference data is needed by multiple clients with different usage characteristics. e.g.

- The search ingester needs the park location and characteristics at ingestion time to create facetted and location based indexes in Elasticsearch
- The search widget needs the park opening dates at page rendering time to decide what calendar dates to display
- Analytics need historic reference data when producting year on year reports

This presents a number of challenging technical considerations:

### Consistency

Whenever we duplicate our reference data, we increase the likelihood of inconsistency. Even if we have one authoritive source of truth, we may cache the reference data in multiple systems, resulting in temporary inconsisenty unless cache updated are sychronoised. Given the reference data is slow moving, a short period of inconsistency may be acceptable.

### Load Times

Some reference data sets may be too large to desirably load over a network connection for web and mobile applications. Therefore we should discorage accidentlaly including large data sets into a client bundle, or requesting large data sets over a network.

### Reliability

Requesting data sets over a network may fail, especially while mobile or on park. Bundling local copies of our reference data into the application (providing they are not too large) will aleviate this, but increase the potential for [stale data](#stale-data).

### Stale Data

Even though reference data is slow moving, it will still change occasionally, especially bewteen seasons. Therefore we need a strategy for refreshing reference data.

### Temporality

When reference data changes, the previous values may still be required for historic comparisons. Therefore all reference data should have an effective date. Effective dates can also be used to synchronise updates by including future records when the values are known in advance. This comes at the cost of increased size, and there may still be some inconsistency due to clock drift and cache expiry times.

### Evolution

Both reference data, and our understanding of our domain evolves over time. We will at some point need to make backwards incompatible changes to our reference data, and will need to do so without breaking client applications. This suggests a versioning and validation mechanism. The issue of temporality compounds the challenge of evolution, since we may need to retrospecively add data to historic records. In some cases this data will not be known (e.g. in what year did Devon Cliffs become dog friendly?). However, in most cases the accuracy of hisotic data is unlikely to be important for anything other than reports, and the likelihood of running very old reports low.

### Local Testing

Our applications must be tested locally, and therefore any solution sould work well on an engineering laptop

## This Solution

```
┌───────────────────────────────────┐         ┌───────────────────────────────────┐         ┌───────────────────────────────────┐         ┌────────────────────────────────────────┐
│                                   │         │                                   │         │                                   │         │                                        │
│            Data Source            │         │            Projection             │         │              Package              │         │                Variant                 │
│                                   │         │                                   │         │                                   │         │                                        │
│    A time series JSON document    │        ╱│    A specific view of the Data    │         │    An npm package wrapping the    │        ╱│   The package contains two variants.   │
│                                   │─────────│  Source. Also a time series JSON  │─────────│            projection             │─────────│                                        │
│                                   │        ╲│             document.             │         │                                   │        ╲│ 1) all [includes all records]          │
│                                   │         │                                   │         │                                   │         │ 2) current-and-future [excludes        │
│                                   │         │                                   │         │                                   │         │    historic records]                   │
│                                   │         │                                   │         │                                   │         │                                        │
└───────────────────────────────────┘         └───────────────────────────────────┘         └───────────────────────────────────┘         └────────────────────────────────────────┘
                  │                                   │                    │
                  │                                   │                    │
                  │                                   │                    │
                  │                                   │                    │
                  └───────┐                   ┌───────┘                    └────────┐
                          │                   │                                     │
                          │                   │                                     │
                          │                   │                                     │
                          │                   │                                    ╱│╲
                  ┌───────────────────────────────────┐           ┌───────────────────────────────────┐
                  │                                   │           │                                   │
                  │         Type Definitions          │           │              Schema               │
                  │                                   │           │                                   │
                  │     Both the Data Source and      │           │       A projection must have      │
                  │ Projections require a set of type │           │ accompanying yup schemas for each │
                  │            definitions            │           │     major and minor release.      │
                  │                                   │           │                                   │
                  │                                   │           │                                   │
                  │                                   │           │                                   │
                  └───────────────────────────────────┘           └───────────────────────────────────┘
```

The solution adopted by this project is to store source data in a GitHub repository as time series JSON documents, and to generate a set of projections which are published as npm packages. The projections and packages are semantically versioned, and validated using [yup](https://www.npmjs.com/package/yup) schemas. The packages also include the projection's TypeScript definitions. To minimise client bundle sizes, each package contains two variations of its projections, 'all' which includes all records, and 'currrent-and-future' which excludes historic ones.

### Pros

- Easy add more sources and projections
- Easy to consume projections (npm install)
- Easy to add more delivery mechanisms (e.g. upload projections to S3 for consumption by snowflake)
- Reliable (no network dependency)
- Traceable via the consumer's package.json files
- Provides an explicit, validated data format
- Provides "good enough" consistency via future effective dates
- Provides version management through semver
- Discourages accidental bundling of large data sets
- Reference data can be used in tests
- Can be extended for non Node.js consumers

### Cons

- Updates must be made manually by engineers for each consumer
- Effective dates are only practical at root document level
- May have to retrospectively add data to historic data sets. In some cases the data will not be available.

## Usage

```ts
import projection from "data-park-opening-dates/current-and-future";

// Get the current park opening dates
const { data: parkOpeningDates } = projection.get();

// Get future park opening dates
const nextSeason = new Date("2023-01-01");
const { data: futureParkOpeningDates } = projection.get(nextSeason);
```

### Adding Data Sources

A data source fetches the raw data we want to project. To add a data source...

1. Create a folder within `sources`, e.g.
   ```sh
   mkdir sources/parks
   ```
1. Add the data files to the folder, one per effective date. Use the naming convention `${source}-${timestamp}.json`. The format of the file must match the following:
   ```json
   {
     "effectiveDate": "2020-12-01T00:00:00Z",
     "data": [
       { "name": "Devon Cliffs", "code": "DC" },
       { "name": "Seashore", "code": "SX" }
     ]
   }
   ```
1. Add type definitions in a file called `index.d.ts`. It will make life easier if you export a type called `SourceType` e.g.

   ```ts
   export SourceType = ParkType;

   type ParkType = {
     name: string,
     code: string,
     dogFriendly: boolean,
     coordinates: {
       latitude: number,
       longitude: number
     },
     openingDates: OpeningDatesType
   };

   type OpeningDatesType = {
     guests: DateRangeType[],
     owners: DateRangeType[],
     touring: DateRangeType[]
   };

   type DateRangeType = {
     from: string,
     to: string
   };
   ```

1. Add the data source in a file called `index.ts`. At the moment only a LocalDataSource is provided. This will fetch the JSON files from the same directory.

   ```ts
   import { ParkType } from "./index.d";
   import LocalDataSource, { LocalDataSourceOptionsType } from "../../src/datasources /LocalDataSource";

   export default class ParksDataSource extends LocalDataSource<ParkType> {
     constructor(options?: LocalDataSourceOptionsType) {
       super("parks", options);
     }
   }
   ```

### Adding Projections

1. Create a folder within `projections`. The name must confirm to [npm's package name rules](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#name). e.g.

```sh
mkdir projections/park-opening-dates
```

1. Add TypeScript definitions in `index.d.ts`, You **must** export a type called `ProjectionType` e.g.

   ```ts
   export type ProjectionType = ParkOpeningDatesType;

   export type ParkOpeningDatesType = {
     code: string;
     openingDates: OpeningDatesType;
   };

   export type OpeningDatesType = {
     guests: DateRangeType[];
     owners: DateRangeType[];
     touring: DateRangeType[];
   };

   export type DateRangeType = {
     from: string;
     to: string;
   };
   ```

1. Create a new projection by extending the Projection class and implementing the \_build method. Set the base directory, version and source in the constructor. e.g.

   ```ts
   import Projection, { ProjectionOptionsType } from "../../src/Projection";
   import { SourceType } from "../../sources/parks/index.d";
   import { ProjectionType } from "./index.d";
   import { DataSourceType } from "../../src";

   export default class ParkOpeningDates extends Projection<SourceType, ProjectionType> {
     constructor(dataSource: DataSourceType<SourceType>, options?: ProjectionOptionsType) {
       super("park-opening-dates", "1.0.0", dataSource, options);
     }

     _build(parks: SourceType[]): ProjectionType[] {
       return parks.map(({ code, openingDates }) => {
         return { code, openingDates };
       });
     }
   }
   ```

1. Create a subfolder called `schemas` for the yup schemas. e.g.

   ```sh
   mkdir projections/park-opening-dates/schemas
   ```

1. Add a [yup](https://www.npmjs.com/package/yup) schema to the schemas directory. The filename (excluding the extension) must match the projection version, e.g. `1.0.0.ts`

   ```ts
   import { object, string, array } from "yup";

   const datePattern = /^\d{4}-\d{2}-\d{2}$/;

   const DateRangeSchema = object()
     .shape({
       from: string().matches(datePattern).required(),
       to: string().matches(datePattern).required(),
     })
     .noUnknown(true);

   const OpeningDatesSchema = object()
     .shape({
       guests: array().of(object().concat(DateRangeSchema)),
       owners: array().of(object().concat(DateRangeSchema)),
       touring: array().of(object().concat(DateRangeSchema)),
     })
     .noUnknown(true);

   const ParkOpeningDatesSchema = object()
     .shape({
       code: string().required(),
       openingDates: object().concat(OpeningDatesSchema),
     })
     .noUnknown(true);

   export default array().required().min(1).of(ParkOpeningDatesSchema);
   ```

1. Dry run the publish and check the output in the `dist/packages` folder
   ```sh
   DEBUG=haven:* npm run publish:dry-run
   ```
1. When you are happy with the projections, publish for them for real.
   ```sh
   DEBUG=haven:* npm run publish
   ```

### Updating Data Sources

It is safe to make non-breaking changes data sources, but you will need to bump the version for any dependent projections by updating their constructors before the updated package will be published. If you need to make a breaking change to a Data Source it is likely that one or more dependent projections will fail validation, and you will have to update the projection's `_build` method to make it backwards compatible, or if this is not possible release a new major version of the projection (see [Updating Projections](#updating-projections).

### Updating Projections

Whenever you want to update a projection you must update the projection version following [semver](https://semver.org/) conventions for major, minor and patch changes. i.e.

- Use `patch` when the underlying data has changed, but the data format has not
- Use `minor` when you have made non-breaking changes to the data format
- Use `major` when you have made breaking changes to the data format

You must add a **completely new** [yup](https://www.npmjs.com/package/yup) schema for both `minor` and `major` releases. Do not edit or reuse/import existing schemas otherwise you may unwittingly hide breaking changes.

If you need to release a new major version but need retain the ability make patch or minor updates to the previous version, follow the steps for [adding a new projection](#adding-projections), using the suffixes of `-v${major}` and `V${major}` for the folder and class names. e.g. `park-opening-dates-v2` and `ParkOpeningDatesV2`, but keep the original package name.

## Local Testing

If you want to test packages locally before publishing them the easiest way is to install a private npm registry such as [verdaccio](https://verdaccio.org/) and temporarily update the `.npmrc` files. After which you can run `npm run publish` to publish any packages to the private registry, from where you can install them. You will need to run `npm login` in order to publish packages.

```
npm i -g vedaccio
npm login --registry http://localhost:4873/
```

## F.A.Q.

### Why not GraphQL?

Because it would have been a nightmare to manage breaking data format changes

### Why not REST?

We did. A [sister project](https://github.com/cressie176/service-haven-projections) exposes the projections via a RESTful API.

### Why not a database?

We wanted a low barrier to entry. If the approach proves useful and managing the reference data becomes a pain, we still might.

## TODO

- Validate package name
- A github action to publish packages
- Prevent large projections (and allow an override)

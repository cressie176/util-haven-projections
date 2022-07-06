import { object, string, array, number, boolean } from "yup";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const AddressSchema = object()
  .shape({
    addressLine1: string().required(),
    addressLine2: string(),
    town: string().required(),
    county: string().required(),
    postCode: string().required(),
  })
  .noUnknown(true);

const CoordinatesSchema = object()
  .shape({
    latitude: number().required(),
    longitude: number().required(),
  })
  .noUnknown(true);

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

const ParkSchema = object()
  .shape({
    name: string().required(),
    code: string().required(),
    address: object().concat(AddressSchema),
    telephone: string().required(),
    coordinates: object().concat(CoordinatesSchema),
    dogFriendly: boolean().required(),
    openingDates: object().concat(OpeningDatesSchema),
  })
  .noUnknown(true);

export default array().required().min(1).of(ParkSchema);

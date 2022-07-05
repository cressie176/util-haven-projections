import { object, string, array } from 'yup';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const DateRangeSchema = object().shape({
  from: string().matches(datePattern).required(),
  to: string().matches(datePattern).required()
}).noUnknown(true)

const OpeningDatesSchema = object().shape({
  guests: array().of(object().concat(DateRangeSchema)),
  owners: array().of(object().concat(DateRangeSchema)),
  touring: array().of(object().concat(DateRangeSchema))
}).noUnknown(true);

const ParkOpeningDatesSchema = object().shape({
  code: string().required(),
  openingDates: object().concat(OpeningDatesSchema)
}).noUnknown(true);

export default array().required().min(1).of(ParkOpeningDatesSchema);

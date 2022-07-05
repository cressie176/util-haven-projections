export type ProjectionType = ParkOpeningDatesType;

type ParkOpeningDatesType = {
  code: string;
  openingDates: OpeningDatesType;
};

type OpeningDatesType = {
  guests: DateRangeType[];
  owners: DateRangeType[];
  touring: DateRangeType[];
};

type DateRangeType = {
  from: string;
  to: string;
};

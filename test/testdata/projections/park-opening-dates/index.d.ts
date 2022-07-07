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

export type ProjectionType = ParkType;

export type ParkType = {
  name: string;
  code: string;
  address: AddressType;
  telephone: string;
  coordinates: CoordinatesType;
  dogFriendly: boolean;
  openingDates: OpeningDatesType;
};

export type AddressType = {
  addressLine1: string;
  addressLine2?: string;
  town: string;
  county: string;
  postCode: string;
};

export type CoordinatesType = {
  latitude: number;
  longitude: number;
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

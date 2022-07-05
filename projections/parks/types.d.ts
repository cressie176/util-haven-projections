export type ProjectionType = ParkType;

type ParkType = {
  name: string,
  code: string,
  address: AddressType,
  telephone: string,
  coordinates: CoordinatesType
  dogFriendly: boolean,
  openingDates: OpeningDatesType
};
  
type AddressType = {
  addressLine1: string,
  addressLine2?: string,
  town: string,
  county: string,
  postCode: string
};
  
type CoordinatesType = {
  latitude: number,
  longitude: number
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
export interface AadhaarData {
  address: string;
  careOf: string;
  dateOfBirth: string;
  email: string;
  fullName: string;
  gender: string;
  phoneNumber: string;
  photo: string;
  rawCashfreeResponse: {
    address: string;
    care_of: string;
    dob: string;
    email: string;
    gender: string;
    message: string;
    mobile_hash: string;
    name: string;
    photo_link: string;
    ref_id: string;
    share_code: string;
    split_address: {
      country: string;
      dist: string;
      house: string;
      landmark: string;
      locality: string;
      pincode: string;
      po: string;
      state: string;
      street: string;
      subdist: string;
      vtc: string;
    };
    status: string;
    xml_file: string;
    year_of_birth: string;
  };
  refId: string;
  shareCode: string;
  splitAddress: {
    country: string;
    dist: string;
    house: string;
    landmark: string;
    locality: string;
    pincode: string;
    po: string;
    state: string;
    street: string;
    subdist: string;
    vtc: string;
  };
  verifiedAt: any;
  xmlFile: string;
  yearOfBirth: string;
}

export interface SavedGuest {
  aadhaarData: AadhaarData;
  aadhaarNumber: string;
  aadhaarVerified: boolean;
  firstName: string;
  id: string;
  phoneNumber: string;
  uid: string;
  updatedAt: any;
}

export interface User {
  createdAt: any;
  email: string;
  fullName: string;
  isBanned: boolean;
  phoneNumber: string;
  photoURL: string;
  role: string;
  savedGuests: SavedGuest[];
  aadhaarData?: AadhaarData;
  aadhaarNumber?: string;
  aadhaarVerified?: boolean;
  firstName?: string;
  uid?: string;
  updatedAt?: any;
}

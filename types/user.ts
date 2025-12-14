// This matches the web app's UserData structure exactly
export interface UserData {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'super-admin';
  isBanned: boolean;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
  preferences?: {
    notifications: boolean;
    marketing: boolean;
    sms: boolean;
  };
  idProofs?: {
    aadhaar?: string;
    pan?: string;
  };
  aadhaarData?: {
    aadhaarNumber: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    verified: boolean;
    verifiedAt: Date | any; // Firebase timestamp
    // Additional Cashfree verification details
    gender?: string;
    photo?: string;
    careOf?: string;
    email?: string;
    splitAddress?: {
      country: string;
      dist: string;
      house: string;
      landmark: string;
      pincode: number;
      po: string;
      state: string;
      street: string;
      subdist: string;
      vtc: string;
      locality: string;
    };
    refId?: string;
    yearOfBirth?: number;
    shareCode?: string;
    xmlFile?: string;
    rawCashfreeResponse?: any;
  };
  savedGuests?: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    aadhaarNumber: string;
    aadhaarVerified?: boolean;
    aadhaarData?: {
      fullName: string;
      dateOfBirth: string;
      address: string;
      phoneNumber: string;
      verifiedAt: Date | any; // Firebase timestamp
      // Additional Cashfree verification details
      gender?: string;
      photo?: string;
      careOf?: string;
      email?: string;
      splitAddress?: {
        country: string;
        dist: string;
        house: string;
        landmark: string;
        pincode: number;
        po: string;
        state: string;
        street: string;
        subdist: string;
        vtc: string;
        locality: string;
      };
      refId?: string;
      yearOfBirth?: number;
      shareCode?: string;
      xmlFile?: string;
      rawCashfreeResponse?: any;
    };
  }>;
  createdAt: any;
  updatedAt: any;
}

// Backward compatibility - export as User as well
export type User = UserData;

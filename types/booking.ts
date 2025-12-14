export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhaarNumber?: string;
  aadhaarVerified?: boolean;
  aadhaarData?: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    verifiedAt: Date;
    gender?: string;
    photo?: string;
    careOf?: string;
    email?: string;
    splitAddress?: any;
    refId?: string;
    yearOfBirth?: number;
    shareCode?: string;
    xmlFile?: string;
    rawCashfreeResponse?: any;
  };
  specialRequests?: string;
}

export interface CustomerPreferences {
  travelerType?: 'corporate' | 'family' | 'couple' | 'transit' | 'event';
  businessEssentials?: {
    workspaceSetup?: string[];
    meetingRoomRequired?: boolean;
    printingScanningService?: boolean;
    airportTransfer?: boolean;
    breakfastTiming?: string;
    laundryService?: boolean;
    highSpeedWiFi?: boolean;
    lateCheckoutRequest?: boolean;
  };
  couplePreferences?: {
    roomAroma?: string;
    romanticSetup?: string;
    noDisturbMode?: boolean;
    snacksAndDrinks?: string;
  };
  familyComforts?: {
    extraBedsCots?: number;
    interconnectedRooms?: boolean;
    kidMeals?: string[];
    familyEntertainment?: string[];
    groupTours?: boolean;
    kitchenetteAccess?: boolean;
    lateNightSnacks?: boolean;
  };
  transitSoloEssentials?: {
    checkInFlexibility?: string;
    breakfastTakeaway?: boolean;
    nearbyAttractions?: string[];
    cabShuttleRequired?: boolean;
    roomTypePreference?: string;
    noiseIsolation?: boolean;
  };
  eventGroupFacilities?: {
    groupSize?: number;
    eventType?: string;
    venueSetup?: string[];
    groupMeal?: string[];
    transportation?: boolean;
    decorationPreferences?: string;
    specialRequests?: string;
  };
  preCheckinEnabled?: boolean;
}

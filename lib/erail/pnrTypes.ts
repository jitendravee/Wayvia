export interface PnrPassenger {
  passengerSerialNumber: number;
  bookingStatus?: string;
  bookingCoachId?: string;
  bookingBerthNo?: number;
  bookingBerthCode?: string;
  bookingStatusDetails?: string;
  currentStatus?: string;
  currentCoachId?: string;
  currentBerthNo?: number;
  currentBerthCode?: string;
  currentStatusDetails?: string;
}

export interface PnrData {
  pnrNumber: string;
  dateOfJourney?: string;
  trainNumber?: string;
  trainName?: string;
  sourceStation?: string;
  destinationStation?: string;
  reservationUpto?: string;
  boardingPoint?: string;
  journeyClass?: string;
  numberOfpassenger?: number;
  chartStatus?: string;
  informationMessage?: string[];
  passengerList?: PnrPassenger[];
  bookingFare?: number;
  ticketFare?: number;
  quota?: string;
  distance?: number;
}

export interface PnrApiResponse {
  success: boolean;
  time_stamp?: number;
  data?: PnrData;
  error?: string;
}

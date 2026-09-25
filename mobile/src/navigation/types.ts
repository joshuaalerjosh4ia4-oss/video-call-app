export type RootStackParamList = {
  Splash: undefined;
  Login: { message?: string } | undefined;
  Register: undefined;
  Main: undefined;
  Home: undefined;
  Room: { roomId: string; passcode: string };
  MeetingHistory: undefined;
  Enrollment: undefined;
  AdminAdmissions: undefined;
  AdminSectionCreate: undefined;
  Ledger: undefined;
};

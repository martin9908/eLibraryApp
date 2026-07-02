/**
 * Root stack contains both auth screens and app screens.
 * React Navigation shows only the relevant set based on auth state
 * (conditional screen rendering inside the navigator).
 */
export type RootStackParamList = {
  // ── Auth ──
  Login: undefined;
  Register: undefined;
  // ── App ──
  Tabs: undefined;
  Modal: undefined;
  BookDetail: { bookId: string };
  BorrowHistory: undefined;
  Reader: {
    bookId: string;
    title: string;
  };
};

export type RootTabParamList = {
  Home: undefined;
  Catalog: undefined;
  Account: undefined;
};
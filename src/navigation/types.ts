export type RootStackParamList = {
  Tabs: undefined;
  RoutineEditor: { routineId?: string };
  RoutineRunner: { routineId: string };
  ScanReceipt: undefined;
  ReceiptDetail: { receiptId: string };
  Stores: undefined;
  StoreEditor: { storeId?: string };
};

export type TabParamList = {
  Today: undefined;
  List: undefined;
  Receipts: undefined;
  Routines: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  RoutineEditor: { routineId?: string };
  RoutineRunner: { routineId: string };
  ScanReceipt: undefined;
  ReceiptDetail: { receiptId: string };
  Stores: undefined;
  StoreEditor: { storeId?: string };
  IngredientScan: { barcode?: string } | undefined;
  BarcodeScan: undefined;
  Pantry: undefined;
  Compare: undefined;
  CompareDetail: { name: string };
};

export type TabParamList = {
  Today: undefined;
  List: undefined;
  Receipts: undefined;
  Routines: undefined;
};

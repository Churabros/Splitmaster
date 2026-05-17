export interface Group {
  id: string;
  name: string;
  members: string[];
  created_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  date: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface BalanceResponse {
  balances: Record<string, number>;
  settlements: Settlement[];
}

export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ReceiptResult {
  items?: ReceiptItem[];
  total?: number;
  currency?: string;
  error?: string;
}

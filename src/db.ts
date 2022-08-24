export interface DbItem {
  title: string;
  description: string;
  completed: boolean;
}

export interface DbItemWithId extends DbItem {
  id: number;
}

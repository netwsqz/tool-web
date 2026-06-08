export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: "high" | "medium" | "low";
  tag?: string;
}

export interface TodoTag {
  id: string;
  name: string;
  color: string;
}

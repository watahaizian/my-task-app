export interface Board {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface List {
  id: string;
  name: string;
  board_id: string;
  position: number;
  created_at: string;
}

export interface Card {
  id: string;
  content: string;
  list_id: string;
  position: number;
  created_at: string;
}
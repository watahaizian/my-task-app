import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import type { List } from "../types";

export const CreateListForm = ({
  boardId,
  onListCreated,
}: {
  boardId: string;
  onListCreated: (newList: List) => void;
}) => {
  const [listName, setListName] = useState("");
  const { getToken } = useAuth();

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: listName,
        boardId: boardId,
      }),
    });

    if (res.ok) {
      const newList: List = await res.json();
      onListCreated(newList);
      setListName("");
    }
  };

  return (
    <div className="flex-shrink-0">
      <form onSubmit={handleCreateList} className="w-72 bg-gray-200/50 p-2 rounded-lg">
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="+ Add another list"
          className="w-full bg-transparent placeholder-gray-600 px-1 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        />
      </form>
    </div>
  );
}
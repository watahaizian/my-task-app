import { useAuth } from "@clerk/clerk-react";
import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import type { Card, List } from "../types";
import { CardComponent } from "./Card";

export const ListComponent = ({ list, cards, onCardCreated }: { list: List; cards: Card[]; onCardCreated: (newCard: Card) => void; }) => {
  const { setNodeRef } = useDroppable({ id: list.id });
  const { getToken } = useAuth();

  const [newCardContent, setNewCardContent] = useState('');

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardContent.trim()) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        content: newCardContent,
        listId: list.id,
      }),
    });

    if (res.ok) {
      const newCard = await res.json();
      onCardCreated(newCard);
      setNewCardContent('');
    }
  };


  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 bg-gray-100 rounded-lg shadow-md"
    >
      <div className="p-3 flex flex-col h-full">
        <h2 className="font-semibold text-gray-800 mb-3 px-1">{list.name}</h2>
        <div className="space-y-3 min-h-[20px] overflow-y-auto flex-grow">
          {cards.map((card) => <CardComponent key={card.id} card={card} />)}
        </div>
        <div className="pt-2">
          <form onSubmit={handleCreateCard}>
            <input
              type="text"
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              placeholder="+ Add a card"
              className="w-full bg-gray-200 hover:bg-gray-300 placeholder-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
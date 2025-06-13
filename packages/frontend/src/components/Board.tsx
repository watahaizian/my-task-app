import { useAuth } from '@clerk/clerk-react';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import type { Board, Card, List } from '../types';
import { CardComponent } from './Card';
import { CreateListForm } from './CreateListForm';
import { ListComponent } from './List';

export const BoardComponent = ({
  initialBoard,
  initialLists,
  initialCards,
}: {
  initialBoard: Board;
  initialLists: List[];
  initialCards: Record<string, Card[]>;
}) => {
  const [board, setBoard] = useState(initialBoard);
  const [lists, setLists] = useState(initialLists);
  const [cardsByList, setCardsByList] = useState(initialCards);
  const [activeCard, setActiveCard] = useState<Card | null>(null); // ドラッグ中のカード
  const { getToken } = useAuth();

  useEffect(() => {
    setBoard(initialBoard);
    setLists(initialLists);
    setCardsByList(initialCards);
  }, [initialBoard, initialLists, initialCards]);

  const handleListCreated = (newList: List) => {
    setLists(prevLists => [...prevLists, newList]);
  };

  const handleCardCreated = (newCard: Card) => {
    setCardsByList(prev => {
      const currentListCards = prev[newCard.list_id] || [];
      return { ...prev, [newCard.list_id]: [...currentListCards, newCard] };
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Card") {
      setActiveCard(event.active.data.current.card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over || !active.data.current?.card) return;

    const activeCardData: Card = active.data.current.card;
    const overListId = over.id as string;

    if (activeCardData.list_id !== overListId) {
      // 楽観的更新
      setCardsByList(prev => {
        const newCardsState = { ...prev };
        const sourceList = newCardsState[activeCardData.list_id]?.filter(c => c.id !== activeCardData.id) ?? [];
        const destinationList = [...(newCardsState[overListId] ?? []), { ...activeCardData, list_id: overListId }];
        newCardsState[activeCardData.list_id] = sourceList;
        newCardsState[overListId] = destinationList;
        return newCardsState;
      });

      const token = await getToken();
      if (!token) return;

      const newPosition = (cardsByList[overListId]?.length || 0);
      fetch(`/api/cards/${activeCardData.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newListId: overListId, newPosition }),
      });
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full p-4">
        <h1 className="text-2xl font-bold mb-4 px-2">{board.name}</h1>
        <div className="flex-grow flex items-start space-x-4 overflow-x-auto pb-4">
          {lists.map(list => (
            <ListComponent
              key={list.id}
              list={list}
              cards={cardsByList[list.id] || []}
              onCardCreated={handleCardCreated}
            />
          ))}
          <CreateListForm boardId={board.id} onListCreated={handleListCreated} />
        </div>
      </div>
      <DragOverlay>
        {activeCard ? <CardComponent card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
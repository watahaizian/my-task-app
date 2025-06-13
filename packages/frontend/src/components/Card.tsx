import { useDraggable } from "@dnd-kit/core";
import type { Card } from "../types";

export const CardComponent = ({ card }: { card: Card }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { type: "Card", card },
  });

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="bg-white p-3 rounded-md shadow-sm border border-gray-200 opacity-30"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="bg-white p-3 rounded-md shadow-sm border border-gray-200"
    >
      <p className="text-sm text-gray-800">{card.content}</p>
    </div>
  );
}
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import type { Board, Card, List } from '../types';
import { BoardComponent } from './Board';
import { Sidebar } from './Sidebar';

export const BoardLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const [activeBoardData, setActiveBoardData] = useState<{
    board: Board;
    lists: List[];
    cards: Record<string, Card[]>;
  } | null>(null);

  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setBoards([]);
      return;
    }
    const fetchBoardList = async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/boards', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Board[] = await res.json();
        setBoards(data);
        // 最初のボードをデフォルトで選択状態にする
        if (data.length > 0 && !selectedBoardId) {
          setSelectedBoardId(data[0].id);
        }
      }
    };
    fetchBoardList();
  }, [isSignedIn, getToken, selectedBoardId]);


  useEffect(() => {
    if (!selectedBoardId || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    const fetchBoardDetails = async () => {
      setIsLoading(true);
      const token = await getToken();
      if (!token) { setIsLoading(false); return; }

      const headers = { Authorization: `Bearer ${token}` };
      const selectedBoard = boards.find(b => b.id === selectedBoardId);
      if (!selectedBoard) { setIsLoading(false); return; }

      try {
        const listsRes = await fetch(`/api/lists?boardId=${selectedBoardId}`, { headers });
        const lists: List[] = await listsRes.json();
        lists.sort((a, b) => a.position - b.position);

        const cardsByList: Record<string, Card[]> = {};
        if (lists.length > 0) {
          const cardPromises = lists.map(list =>
            fetch(`/api/cards?listId=${list.id}`, { headers }).then(res => res.json())
          );
          const cardsResults: Card[][] = await Promise.all(cardPromises);
          lists.forEach((list, index) => {
            cardsByList[list.id] = cardsResults[index].sort((a, b) => a.position - b.position);
          });
        }

        setActiveBoardData({ board: selectedBoard, lists, cards: cardsByList });

      } catch (error) {
        console.error("ボード詳細の取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardDetails();
  }, [selectedBoardId, isSignedIn, getToken, boards]);


  const handleBoardCreated = (newBoard: Board) => {
    setBoards(prev => [...prev, newBoard]);
    setSelectedBoardId(newBoard.id);
  };

  const showLoadingOrEmpty = isLoading || !selectedBoardId;

  return (
    <div className="flex h-full">
      <Sidebar
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={setSelectedBoardId}
        onBoardCreated={handleBoardCreated}
      />
      <div className="flex-1 overflow-hidden">
        {showLoadingOrEmpty ? (
          <div className="p-8 text-center">
            {isLoading ? "ローディング中..." : "ボードを選択するか、新しいボードを作成してください。"}
          </div>
        ) : (
          activeBoardData && (
            <BoardComponent
              key={activeBoardData.board.id}
              initialBoard={activeBoardData.board}
              initialLists={activeBoardData.lists}
              initialCards={activeBoardData.cards}
            />
          )
        )}
      </div>
    </div>
  );
}
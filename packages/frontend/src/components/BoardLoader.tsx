import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import type { Board, Card, List } from '../types';
import { BoardComponent } from './Board';
import { Sidebar } from './Sidebar';

export function BoardLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // ★ 選択されたボードの詳細データ（リストやカードも含む）を管理するstate
  const [activeBoardData, setActiveBoardData] = useState<{
    board: Board;
    lists: List[];
    cards: Record<string, Card[]>;
  } | null>(null);

  const { getToken, isSignedIn } = useAuth();

  // ★ このuseEffectは「サイドバー用のボード一覧」を取得するためだけ
  useEffect(() => {
    if (!isSignedIn) {
      setBoards([]); // サインアウトしたらクリア
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


  // ★★★ この新しいuseEffectが「選択されたボードの詳細」を取得する！ ★★★
  useEffect(() => {
    // 選択されたボードがなければ何もしない
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
        // 1. リストを取得
        const listsRes = await fetch(`/api/lists?boardId=${selectedBoardId}`, { headers });
        const lists: List[] = await listsRes.json();
        lists.sort((a, b) => a.position - b.position);

        // 2. カードをまとめて取得
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

        // 3. 全てのデータをまとめてセット
        setActiveBoardData({ board: selectedBoard, lists, cards: cardsByList });

      } catch (error) {
        console.error("ボード詳細の取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardDetails();
  }, [selectedBoardId, isSignedIn, getToken, boards]); // ★ selectedBoardIdが変わるたびに再取得！


  const handleBoardCreated = (newBoard: Board) => {
    setBoards(prev => [...prev, newBoard]);
    setSelectedBoardId(newBoard.id);
  };

  // ローディング中は、選択されたボードがない場合と同じ表示
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
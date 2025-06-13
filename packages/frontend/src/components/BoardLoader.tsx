import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import type { Board } from '../types';
import { BoardComponent } from './Board';
import { Sidebar } from './Sidebar';

export const BoardLoader = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getToken, isLoaded } = useAuth();

    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        const fetchBoards = async () => {
            const token = await getToken();
            if (!token) { setIsLoading(false); return; }

            try {
                const res = await fetch('/api/boards', { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data: Board[] = await res.json();
                    setBoards(data);
                    if (data.length > 0) {
                        setSelectedBoardId(data[0].id);
                    }
                }
            } catch (error) { console.error("Failed to fetch boards:", error); }
            finally { setIsLoading(false); }
        };
        fetchBoards();
    }, [isLoaded, getToken]);

    const handleBoardCreated = (newBoard: Board) => {
        setBoards(prev => [...prev, newBoard]);
        setSelectedBoardId(newBoard.id);
    };

    const selectedBoard = boards.find(b => b.id === selectedBoardId);

    if (isLoading) {
        return <div className="p-8 text-center">ローディング中...</div>;
    }

    return (
        <div className="flex h-full">
            <Sidebar
                boards={boards}
                selectedBoardId={selectedBoardId}
                onSelectBoard={setSelectedBoardId}
                onBoardCreated={handleBoardCreated}
            />
            <div className="flex-1 overflow-hidden">
                {selectedBoard ? (
                    <BoardComponent
                        key={selectedBoard.id}
                        initialBoard={selectedBoard}
                        initialLists={[]}
                        initialCards={{}}
                    />
                ) : (
                    <div className="p-8 text-center">ボードを選択するか、新しいボードを作成してください。</div>
                )}
            </div>
        </div>
    );
}
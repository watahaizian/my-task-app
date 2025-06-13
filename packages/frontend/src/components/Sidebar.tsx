import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';
import type { Board } from '../types';

interface SidebarProps {
    boards: Board[];
    selectedBoardId: string | null;
    onSelectBoard: (id: string) => void;
    onBoardCreated: (newBoard: Board) => void;
}

export const Sidebar = ({ boards, selectedBoardId, onSelectBoard, onBoardCreated }: SidebarProps) => {
    const [newBoardName, setNewBoardName] = useState('');
    const { getToken } = useAuth();

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: newBoardName }),
        });

        if (res.ok) {
            const newBoard = await res.json();
            onBoardCreated(newBoard);
            setNewBoardName('');
        }
    };

    return (
        <aside className="w-64 bg-slate-100 p-4 flex flex-col border-r border-slate-200">
            <h2 className="text-lg font-semibold mb-4">マイボード</h2>
            <nav className="flex-grow">
                <ul>
                    {boards.map(board => (
                        <li key={board.id}>
                            <button
                                type="button"
                                onClick={() => onSelectBoard(board.id)}
                                className={`w-full text-left p-2 rounded-md text-slate-700 ${selectedBoardId === board.id ? 'bg-blue-200 font-bold' : 'hover:bg-slate-200'
                                    }`}
                            >
                                {board.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div>
                <form onSubmit={handleCreateBoard}>
                    <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="新しいボードを作成"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </form>
            </div>
        </aside>
    );
}
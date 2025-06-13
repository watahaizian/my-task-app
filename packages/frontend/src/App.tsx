import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BoardLoader } from './components/BoardLoader';

const App = () => {
  return (
    <div className='h-screen bg-slate-50 flex flex-col'>
      <header className="p-2 border-b bg-white shadow-sm flex-shrink-0 z-10">
        <div className="max-w-full mx-auto flex justify-between items-center px-4">
          <h1 className="text-xl font-bold text-slate-800">My Task App</h1>
          <div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <SignedIn>
          <BoardLoader />
        </SignedIn>
        <SignedOut>
          <div className="text-center p-16">
            <h2 className="text-2xl font-semibold text-slate-700">ようこそ！</h2>
            <p className="mt-2 text-slate-500">ログインしてタスク管理を始めましょう。</p>
            <div className="mt-4">
              <SignInButton mode="modal" />
            </div>
          </div>
        </SignedOut>
      </main>
    </div>
  );
}

export default App;
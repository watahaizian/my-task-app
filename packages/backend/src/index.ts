import { createClerkClient } from '@clerk/backend'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

// Clerkの認証ミドルウェア
app.use('/api/*', clerkMiddleware())

// ユーザー登録ミドルウェア
app.use('/api/*', async (c, next) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ err: 'Unauthorized' }, 401)
  }

  try {
    const clerkClient = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY })
    const dbUser = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(auth.userId).first()

    if (!dbUser) {
      const user = await clerkClient.users.getUser(auth.userId)
      const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

      await c.env.DB.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)')
        .bind(auth.userId, primaryEmail ?? '', user.firstName ?? '')
        .run()
    } else {
      console.log(`ユーザー ${auth.userId} は既に存在します。`)
    }

  } catch (e) {
    console.error("★★★ ユーザー登録ミドルウェアでエラーが発生しました ★★★", e)
    return c.json({ err: 'Middleware Error' }, 500)
  }

  await next()
})


// ===== ボードAPI =====
app.get('/api/boards', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  try {
    const { results } = await c.env.DB
      .prepare('SELECT * FROM boards WHERE user_id = ?')
      .bind(auth.userId)
      .all()
    return c.json(results)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

app.post('/api/boards', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  try {
    const { name } = await c.req.json<{ name: string }>()
    if (!name) return c.json({ err: 'Name is required' }, 400)
    const newBoard = { id: crypto.randomUUID(), name, user_id: auth.userId }
    await c.env.DB
      .prepare('INSERT INTO boards (id, name, user_id) VALUES (?, ?, ?)')
      .bind(newBoard.id, newBoard.name, newBoard.user_id)
      .run()
    return c.json(newBoard, 201)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

// リストAPI
app.get('/api/lists', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  const boardId = c.req.query('boardId')
  if (!boardId) return c.json({ err: 'boardId is required' }, 400)
  try {
    const board = await c.env.DB
      .prepare('SELECT id FROM boards WHERE id = ? AND user_id = ?')
      .bind(boardId, auth.userId)
      .first()
    if (!board) return c.json({ err: 'Board not found or access denied' }, 404)
    const { results } = await c.env.DB
      .prepare('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC')
      .bind(boardId)
      .all()
    return c.json(results)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

app.post('/api/lists', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  try {
    const { name, boardId } = await c.req.json<{ name: string; boardId: string }>()
    if (!name || !boardId) return c.json({ err: 'Name and boardId are required' }, 400)
    const board = await c.env.DB
      .prepare('SELECT id FROM boards WHERE id = ? AND user_id = ?')
      .bind(boardId, auth.userId)
      .first()
    if (!board) return c.json({ err: 'Board not found or access denied' }, 404)
    const result = await c.env.DB
      .prepare('SELECT count(*) as count FROM lists WHERE board_id = ?')
      .bind(boardId)
      .first<{ count: number }>()
    const position = result ? result.count : 0
    const newList = { id: crypto.randomUUID(), name, board_id: boardId, position }
    await c.env.DB
      .prepare('INSERT INTO lists (id, name, board_id, position) VALUES (?, ?, ?, ?)')
      .bind(newList.id, newList.name, newList.board_id, newList.position)
      .run()
    return c.json(newList, 201)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

// カードAPI
app.get('/api/cards', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  const listId = c.req.query('listId')
  if (!listId) return c.json({ err: 'listId is required' }, 400)
  try {
    const list = await c.env.DB
      .prepare(
        'SELECT l.id FROM lists l JOIN boards b ON l.board_id = b.id WHERE l.id = ? AND b.user_id = ?'
      )
      .bind(listId, auth.userId)
      .first()
    if (!list) return c.json({ err: 'List not found or access denied' }, 404)
    const { results } = await c.env.DB
      .prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY position ASC')
      .bind(listId)
      .all()
    return c.json(results)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

app.post('/api/cards', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  try {
    const { content, listId } = await c.req.json<{ content: string; listId: string }>()
    if (!content || !listId) return c.json({ err: 'Content and listId are required' }, 400)
    const list = await c.env.DB
      .prepare(
        'SELECT l.id FROM lists l JOIN boards b ON l.board_id = b.id WHERE l.id = ? AND b.user_id = ?'
      )
      .bind(listId, auth.userId)
      .first()
    if (!list) return c.json({ err: 'List not found or access denied' }, 404)
    const result = await c.env.DB
      .prepare('SELECT count(*) as count FROM cards WHERE list_id = ?')
      .bind(listId)
      .first<{ count: number }>()
    const position = result ? result.count : 0
    const newCard = { id: crypto.randomUUID(), content, list_id: listId, position }
    await c.env.DB
      .prepare('INSERT INTO cards (id, content, list_id, position) VALUES (?, ?, ?, ?)')
      .bind(newCard.id, newCard.content, newCard.list_id, newCard.position)
      .run()
    return c.json(newCard, 201)
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

app.patch('/api/cards/:id/move', async c => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ err: 'Unauthorized' }, 401)
  try {
    const cardId = c.req.param('id')
    const { newListId, newPosition } = await c.req.json<{ newListId: string; newPosition: number }>()
    if (!newListId || newPosition === undefined) {
      return c.json({ err: 'newListId and newPosition are required' }, 400)
    }
    const card = await c.env.DB
      .prepare(
        'SELECT c.id FROM cards c JOIN lists l ON c.list_id = l.id JOIN boards b ON l.board_id = b.id WHERE c.id = ? AND b.user_id = ?'
      )
      .bind(cardId, auth.userId)
      .first()
    if (!card) return c.json({ err: 'Card not found or access denied' }, 404)
    const list = await c.env.DB
      .prepare('SELECT l.id FROM lists l JOIN boards b ON l.board_id = b.id WHERE l.id = ? AND b.user_id = ?')
      .bind(newListId, auth.userId)
      .first()
    if (!list) return c.json({ err: 'Destination list not found or access denied' }, 404)
    await c.env.DB
      .prepare('UPDATE cards SET list_id = ?, position = ? WHERE id = ?')
      .bind(newListId, newPosition, cardId)
      .run()
    return c.json({ success: true })
  } catch (e) {
    console.error(e)
    return c.json({ err: 'Internal Server Error' }, 500)
  }
})

// 静的ファイルの提供
app.all('*', (c) =>
  c.env.ASSETS
    ? c.env.ASSETS.fetch(c.req.raw)
    : new Response('Not found', { status: 404 })
);

export default app

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

async function loadConversationCards() {
  const source = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  const start = source.indexOf('function conversationCards')
  const end = source.indexOf('function canvasConnectors')
  const context = { globalThis: {}, messagesFor: thread => thread.messages, state: { branchAnchors: new Map(), liveReplies: new Map() } }
  vm.createContext(context)
  vm.runInContext(`${source.slice(start, end)};globalThis.conversationCards = conversationCards`, context)
  return context.globalThis.conversationCards
}

test('projects each user question in one DSH session as a connected canvas card', async () => {
  const conversationCards = await loadConversationCards()
  const cards = conversationCards([{
    id: 'session-1', parentId: null, position: { x: 86, y: 82 },
    messages: [
      { kind: 'user', text: '第一个问题', sourceSeq: 1 },
      { kind: 'assistant', text: '第一个回答草稿', sourceSeq: 2 },
      { kind: 'assistant', text: '第一个最终回答', sourceSeq: 3 },
      { kind: 'user', text: '第二个问题', sourceSeq: 4 },
      { kind: 'assistant', text: '第二个最终回答', sourceSeq: 5 },
    ],
  }])

  assert.equal(cards.length, 2)
  assert.equal(cards[0].question, '第一个问题')
  assert.equal(cards[0].answer.text, '第一个最终回答')
  assert.equal(cards[1].question, '第二个问题')
  assert.equal(cards[1].parentId, cards[0].id)
  assert.equal(cards[1].position.x, cards[0].position.x + 365)
})

test('connects a restored fork to its DSH seed boundary, not its canvas position', async () => {
  const conversationCards = await loadConversationCards()
  const cards = conversationCards([
    {
      id: 'parent', parentId: null, position: { x: 86, y: 82 },
      messages: [
        { kind: 'user', text: '第一轮', sourceSeq: 1 },
        { kind: 'assistant', text: '第一轮回答', sourceSeq: 2 },
        { kind: 'user', text: '第二轮', sourceSeq: 5 },
        { kind: 'assistant', text: '第二轮回答', sourceSeq: 6 },
        { kind: 'user', text: '第三轮', sourceSeq: 9 },
        { kind: 'assistant', text: '第三轮回答', sourceSeq: 10 },
      ],
    },
    {
      id: 'child', parentId: 'parent', sourceSeedLength: 8, position: { x: 9999, y: -9999 },
      messages: [
        { kind: 'user', text: '分支问题', sourceSeq: 9 },
        { kind: 'assistant', text: '分支回答', sourceSeq: 10 },
      ],
    },
  ])

  const parentTurns = cards.filter(card => card.dshThreadId === 'parent')
  const childTurn = cards.find(card => card.dshThreadId === 'child')
  assert.equal(childTurn.parentId, parentTurns[1].id)
})

test('uses a restored child message sequence to reconnect a legacy fork at its user turn', async () => {
  const conversationCards = await loadConversationCards()
  const cards = conversationCards([
    {
      id: 'parent', parentId: null, position: { x: 86, y: 82 },
      messages: [
        { kind: 'user', text: '你好', sourceSeq: 7 },
        { kind: 'assistant', text: '你好，我是助手。', sourceSeq: 111 },
        { kind: 'user', text: '你是谁', sourceSeq: 118 },
        { kind: 'assistant', text: '我是 DSH。', sourceSeq: 278 },
      ],
    },
    {
      id: 'child', parentId: 'parent', sourceSeedLength: null, position: { x: 1200, y: 900 },
      messages: [
        { kind: 'user', text: '代码是什么', sourceSeq: 121 },
        { kind: 'assistant', text: '代码是指令。', sourceSeq: 569 },
      ],
    },
  ])

  const parentTurns = cards.filter(card => card.dshThreadId === 'parent')
  const childTurn = cards.find(card => card.dshThreadId === 'child')
  assert.equal(childTurn.parentId, parentTurns[1].id)
})

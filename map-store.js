import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'

const MAP_ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const MAX_TITLE_LENGTH = 120

/** Directory-backed, profile-shared named map persistence. */
export class MapDirectoryStore {
  constructor(mapDirectory, legacyStore) {
    if (typeof mapDirectory !== 'string' || mapDirectory.trim() === '') throw new Error('synapse: config.mapDirectory must be a non-empty path')
    this.mapDirectory = mapDirectory
    this.mapsDirectory = join(mapDirectory, 'maps')
    this.indexFile = join(mapDirectory, 'index.json')
    this.legacyStore = legacyStore
    this.serial = Promise.resolve()
    this.index = undefined
    this.ready = this.load()
  }

  async list() {
    await this.ready
    return this.index.maps.map(map => ({ ...map, active: map.id === this.index.activeMapId }))
  }

  async active() {
    await this.ready
    return this.readMap(this.index.activeMapId)
  }

  async create(title) {
    return this.mutate(async () => {
      const now = new Date().toISOString()
      const map = { id: 'map-' + randomUUID(), title: requiredTitle(title), createdAt: now, updatedAt: now }
      this.index.maps.push(map)
      await this.writeMap({ version: 1, ...map, mapState: {}, cardNotes: {} })
      await this.writeIndex()
      return { ...map, active: false }
    })
  }

  async select(id) {
    return this.mutate(async () => {
      const map = this.find(id)
      this.index.activeMapId = map.id
      await this.writeIndex()
      return { ...map, active: true }
    })
  }

  async getState() {
    const map = await this.active()
    return { map: structuredClone(map.mapState), notes: structuredClone(map.cardNotes), activeMap: this.summary(map) }
  }

  async setState(mapState, cardNotes) {
    if (mapState !== undefined && !isRecord(mapState)) throw new Error('mapState 必须是对象')
    if (cardNotes !== undefined && !isRecord(cardNotes)) throw new Error('cardNotes 必须是对象')
    return this.mutate(async () => {
      const current = await this.readMap(this.index.activeMapId)
      if (mapState !== undefined) current.mapState = mapState
      if (cardNotes !== undefined) current.cardNotes = cardNotes
      current.updatedAt = new Date().toISOString()
      this.find(current.id).updatedAt = current.updatedAt
      await this.writeMap(current)
      await this.writeIndex()
      return { map: structuredClone(current.mapState), notes: structuredClone(current.cardNotes), activeMap: this.summary(current) }
    })
  }

  async load() {
    await mkdir(this.mapsDirectory, { recursive: true })
    try {
      this.index = normalizeIndex(JSON.parse(await readFile(this.indexFile, 'utf8')))
      return
    } catch (error) {
      if (error?.code !== 'ENOENT') throw new Error('synapse: cannot read map index: ' + error.message)
    }
    // One-time copy: legacy data stays untouched in workspaces.json.
    await this.legacyStore.ready
    const now = new Date().toISOString()
    const map = { id: 'default', title: '默认地图', createdAt: now, updatedAt: now }
    this.index = { version: 1, activeMapId: map.id, maps: [map] }
    await this.writeMap({ version: 1, ...map, mapState: structuredClone(this.legacyStore.state.mapState ?? {}), cardNotes: structuredClone(this.legacyStore.state.cardNotes ?? {}) })
    await this.writeIndex()
  }

  async mutate(action) {
    await this.ready
    const task = this.serial.then(action)
    this.serial = task.catch(() => undefined)
    return task
  }

  find(id) {
    if (typeof id !== 'string' || !MAP_ID.test(id)) throw new Error('地图 id 无效')
    const map = this.index.maps.find(item => item.id === id)
    if (map === undefined) throw new Error('地图不存在')
    return map
  }

  async readMap(id) {
    const meta = this.find(id)
    try {
      const value = JSON.parse(await readFile(this.mapFile(id), 'utf8'))
      if (value?.version !== 1 || value.id !== id || !isRecord(value.mapState) || !isRecord(value.cardNotes)) throw new Error('地图文件格式无效')
      return { ...meta, mapState: value.mapState, cardNotes: value.cardNotes, updatedAt: value.updatedAt ?? meta.updatedAt }
    } catch (error) {
      throw new Error('synapse: cannot read map ' + id + ': ' + error.message)
    }
  }

  mapFile(id) { return join(this.mapsDirectory, id + '.json') }
  summary(map) { return { id: map.id, title: map.title, createdAt: map.createdAt, updatedAt: map.updatedAt, active: map.id === this.index.activeMapId } }
  async writeIndex() { await atomicWrite(this.indexFile, this.index) }
  async writeMap(map) { await atomicWrite(this.mapFile(map.id), { ...map, version: 1 }) }
}

function normalizeIndex(value) {
  if (value?.version !== 1 || !Array.isArray(value.maps)) throw new Error('地图索引格式无效')
  const maps = value.maps.map(map => ({ id: map?.id, title: map?.title, createdAt: map?.createdAt, updatedAt: map?.updatedAt })).filter(map => MAP_ID.test(map.id) && typeof map.title === 'string' && map.title.trim() !== '' && typeof map.createdAt === 'string' && typeof map.updatedAt === 'string')
  if (maps.length === 0 || !maps.some(map => map.id === value.activeMapId)) throw new Error('地图索引没有有效活动地图')
  return { version: 1, activeMapId: value.activeMapId, maps }
}

function requiredTitle(value) {
  if (typeof value !== 'string') throw new Error('地图名称必须是文本')
  const title = value.trim().replace(/[\u0000-\u001f\u007f]/g, '')
  if (title === '') throw new Error('地图名称不能为空')
  if (title.length > MAX_TITLE_LENGTH) throw new Error('地图名称不能超过 ' + MAX_TITLE_LENGTH + ' 个字符')
  return title
}

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }

async function atomicWrite(file, value) {
  const temporary = file + '.' + process.pid + '.' + randomUUID() + '.tmp'
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, file)
}

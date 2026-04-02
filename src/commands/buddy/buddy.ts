import { companionUserId, getCompanion, roll } from '../../buddy/companion.js'
import type { ToolUseContext } from '../../Tool.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function hatchCompanion(): void {
  const userId = companionUserId()
  const { bones, inspirationSeed } = roll(userId)
  const seed = hashString(`${userId}:${inspirationSeed}:${bones.species}:${bones.rarity}`)
  const tag = String(seed % 1000).padStart(3, '0')
  const name = `${bones.species}-${tag}`
  const personality = `${bones.rarity} ${bones.species} companion`

  saveGlobalConfig(current => ({
    ...current,
    companion: {
      name,
      personality,
      hatchedAt: Date.now(),
    },
  }))
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  _args: string,
): Promise<null> {
  let companion = getCompanion()
  if (!companion) {
    hatchCompanion()
    companion = getCompanion()
  }

  if (!companion) {
    onDone('Could not hatch companion right now. Please try again.', {
      display: 'system',
    })
    return null
  }

  if (getGlobalConfig().companionMuted) {
    onDone(
      `${companion.name} is muted in settings.`,
      { display: 'system' },
    )
    return null
  }

  context.setAppState(prev => ({
    ...prev,
    companionPetAt: Date.now(),
  }))

  onDone(`You pet ${companion.name}.`, { display: 'system' })
  return null
}

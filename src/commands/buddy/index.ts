import type { Command } from '../../commands.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Interact with your companion beside the prompt',
  immediate: true,
  load: () => import('./buddy.js'),
} satisfies Command

export default buddy

import { z } from 'zod/v4'
import type { ValidationResult } from '../../Tool.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { resolveAttachments, validateAttachmentPaths } from '../BriefTool/attachments.js'
import {
  DESCRIPTION,
  SEND_USER_FILE_TOOL_NAME,
  SEND_USER_FILE_TOOL_PROMPT,
} from './prompt.js'

const inputSchema = lazySchema(() =>
  z
    .object({
      files: z
        .array(z.string())
        .optional()
        .describe('File paths to send to the user as attachments'),
      path: z
        .string()
        .optional()
        .describe('Single file path (legacy shortcut for files=[path])'),
    })
    .refine(input => (input.files?.length ?? 0) > 0 || Boolean(input.path), {
      message: 'Provide at least one file using files[] or path.',
      path: ['files'],
    }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    attachments: z.array(
      z.object({
        path: z.string(),
        size: z.number(),
        isImage: z.boolean(),
        file_uuid: z.string().optional(),
      }),
    ),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>
type Output = z.infer<OutputSchema>

function normalizePaths(input: z.infer<InputSchema>): string[] {
  if (input.files && input.files.length > 0) return input.files
  return input.path ? [input.path] : []
}

export const SendUserFileTool = buildTool({
  name: SEND_USER_FILE_TOOL_NAME,
  maxResultSizeChars: 100_000,
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  async validateInput(input): Promise<ValidationResult> {
    const paths = normalizePaths(input)
    return validateAttachmentPaths(paths)
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return SEND_USER_FILE_TOOL_PROMPT
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Delivered ${output.attachments.length} file(s) to user.`,
    }
  },
  async call(input, context) {
    const paths = normalizePaths(input)
    const appState = context.getAppState()
    const attachments = await resolveAttachments(paths, {
      replBridgeEnabled: appState.replBridgeEnabled,
      signal: context.abortController.signal,
    })
    return { data: { attachments } }
  },
} satisfies ToolDef<InputSchema, Output>)

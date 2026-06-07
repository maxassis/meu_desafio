import { z } from 'zod'

export const CheckCompletionSchema = z.object({
  inscriptionId: z.coerce.number().int().positive(),
  taskId: z.coerce.number().int().positive().optional(),
  distance: z.coerce.number().nonnegative(),
})

export type CheckCompletionInput = z.infer<typeof CheckCompletionSchema>

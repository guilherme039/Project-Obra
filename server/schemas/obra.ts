import { z } from 'zod';

export const createObraSchema = z.object({
  name: z.string().min(1, 'Nome da obra é obrigatório'),
  materialsCost: z.number().min(0, 'Custo de materiais deve ser positivo').optional(),
  laborCost: z.number().min(0, 'Custo de mão de obra deve ser positivo').optional(),
  totalCost: z.number().min(0, 'Custo total deve ser positivo').optional(),
  progress: z.number().min(0).max(100, 'Progresso deve estar entre 0 e 100'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['Em andamento', 'Concluida', 'Pausada']),
  client: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url('URL de imagem inválida').optional().nullable(),
});

export const updateObraSchema = createObraSchema.partial();

export type CreateObraInput = z.infer<typeof createObraSchema>;
export type UpdateObraInput = z.infer<typeof updateObraSchema>;

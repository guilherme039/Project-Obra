import { z } from 'zod';

export const createFornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
});

export const updateFornecedorSchema = createFornecedorSchema.partial();

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>;
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>;

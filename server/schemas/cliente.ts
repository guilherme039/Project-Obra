import { z } from 'zod';

export const createClienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

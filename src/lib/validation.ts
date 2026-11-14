import { z } from 'zod';
import type { Collection } from '@/types/domain';
export const text = z.string().trim().min(2,'Escriba al menos 2 caracteres.');
export const schemas = {
  clients: z.object({name:text,document:text,email:z.union([z.literal(''),z.email('Ingrese un correo válido.')]),personType:z.string(),representative:z.string()}).refine(v=>v.personType!=='jurídica'||v.representative.trim().length>1,{path:['representative'],message:'Indique el representante legal.'}),
  cases:z.object({name:text,code:text,clientId:z.string().min(1,'Seleccione un cliente.'),assigneeId:z.string().min(1,'Seleccione un responsable.')}),
  tasks:z.object({name:text,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Seleccione una fecha.'),assigneeId:z.string().min(1,'Seleccione un responsable.')}),
  documents:z.object({name:text}), timeline:z.object({name:text,description:text,date:z.string().min(1,'Seleccione una fecha.')}),
  members:z.object({name:text,email:z.email('Ingrese un correo válido.')}),organizations:z.object({name:text})
};
export function validate(collection:Collection, value:unknown) { const schema = schemas[collection as keyof typeof schemas]; return schema?.safeParse(value); }
export function validateFile(file:File) { if (file.size>10*1024*1024) throw new Error('El archivo supera el límite de 10 MB.'); if (!/\.(pdf|png|jpe?g|webp|docx|txt)$/i.test(file.name)) throw new Error('Formato no permitido. Use PDF, PNG, JPG, WebP, DOCX o TXT.'); if (!file.size) throw new Error('El archivo está vacío.'); }

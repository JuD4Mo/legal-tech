'use client';
import { useState } from 'react';
import { fields } from '@/features/fields';
import { validate } from '@/lib/validation';
import { today } from '@/lib/dates';
import type { Collection, Database, Entity, Session } from '@/types/domain';
import { Modal } from './ui';
import { UploadCloud, Save } from 'lucide-react';
export function EntityForm({collection,existing,defaults,db,session,onClose,onSave,version=false}:{collection:Collection;existing?:Entity;defaults?:Record<string,string>;db:Database;session:Session;onClose:()=>void;onSave:(entity:Entity,file?:File)=>Promise<void>;version?:boolean}) {
 const [value,setValue]=useState<Record<string,unknown>>(()=>{
 const initial:Record<string,unknown>={id:crypto.randomUUID(),organizationId:session.organizationId,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),createdBy:session.memberId};
 for(const field of fields[collection]??[]){
  initial[field.key]=field.options?.[0]??'';
  if(field.type==='date')initial[field.key]=today();
  if(field.type==='time')initial[field.key]='09:00';
 }
 if(collection==='tasks')initial.assigneeId=session.memberId;
 if(collection==='cases'){
  initial.code=`LSO-${Date.now().toString().slice(-5)}`;
  initial.assigneeId=db.members.find(m=>m.organizationId===session.organizationId&&m.role!=='asistente'&&m.status==='activo')?.id??'';
 }
 if(collection==='documents')Object.assign(initial,{mime:'',size:0,version:0,sample:false});
 if(collection==='organizations')initial.demo=true;
 return {...initial,...existing,...defaults};
 });const [errors,setErrors]=useState<Record<string,string>>({});const [file,setFile]=useState<File>();const [saving,setSaving]=useState(false);const [dirty,setDirty]=useState(false);
 function close(){if(!dirty||confirm('¿Descartar los cambios sin guardar?'))onClose();}
 async function submit(e:React.FormEvent){e.preventDefault();const result=validate(collection,value);if(result&&!result.success){setErrors(Object.fromEntries(result.error.issues.map(i=>[String(i.path[0]),i.message])));return;}if(collection==='documents'&&(!existing||version)&&!file){setErrors({file:'Seleccione un archivo de prueba.'});return;}setSaving(true);try{await onSave(value as unknown as Entity,file);onClose();}catch(e){setErrors({form:e instanceof Error?e.message:'No se pudo guardar.'});}finally{setSaving(false);}}
 return <Modal title={version?'Subir nueva versión':`${existing?'Editar':'Crear'} ${({clients:'cliente',cases:'expediente',tasks:'actividad',documents:'documento',timeline:'registro manual',members:'miembro',organizations:'espacio'} as Record<string,string>)[collection]}`} onClose={close}><form onSubmit={submit}><div className="form-grid">{!version&&(fields[collection]??[]).filter(f=>f.key!=='representative'||value.personType==='jurídica').map(f=>{let options:{id:string;name:string}[]=[];if(['clients','cases','members','lawyers'].includes(f.type??'')){const key=f.type==='lawyers'?'members':f.type as 'clients'|'cases'|'members';options=db[key].filter(v=>v.organizationId===session.organizationId).filter(v=>f.type!=='lawyers'||('role'in v&&v.role!=='asistente')).filter(v=>key!=='members'||('status'in v&&v.status==='activo'));}return <label className={f.type==='textarea'?'span-2':''} key={f.key}>{f.label}{f.required&&<span className="required"> *</span>}{f.options||options.length||['clients','cases','members','lawyers'].includes(f.type??'')?<select value={String(value[f.key]??'')} required={f.required} onChange={e=>{const update:Record<string,unknown>={[f.key]:e.target.value};if(f.key==='caseId'&&e.target.value)update.clientId=db.cases.find(c=>c.id===e.target.value)?.clientId??'';setValue({...value,...update});setDirty(true);}}>{!f.options&&<option value="">Seleccionar…</option>}{f.options?.map(o=><option key={o}>{o}</option>)}{options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>:f.type==='textarea'?<textarea rows={4} value={String(value[f.key]??'')} onChange={e=>{setValue({...value,[f.key]:e.target.value});setDirty(true);}} required={f.required}/>:<input type={f.type??'text'} value={String(value[f.key]??'')} onChange={e=>{setValue({...value,[f.key]:e.target.value});setDirty(true);}} required={f.required}/ >}{errors[f.key]&&<small className="error">{errors[f.key]}</small>}</label>;})}
 {collection==='documents'&&(!existing||version)&&<label className="upload-area span-2"><UploadCloud size={30}/><strong>{file?file.name:'Seleccione un archivo de prueba'}</strong><span>PDF, imágenes, DOCX o TXT · máximo 10 MB · almacenamiento local</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt" onChange={e=>{setFile(e.target.files?.[0]);setDirty(true);}}/>{errors.file&&<small className="error">{errors.file}</small>}</label>}
 </div>{collection==='tasks'&&<p className="notice">Los términos y vencimientos deben ser verificados por el profesional responsable. Los recordatorios solo aparecen al entrar a la aplicación.</p>}{errors.form&&<p className="error notice" role="alert">{errors.form}</p>}<div className="form-actions"><button type="button" className="button secondary" onClick={close}>Cancelar</button><button className="button" disabled={saving}><Save size={16}/>{saving?'Guardando…':'Guardar cambios'}</button></div></form></Modal>;
}

'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
export function Brand(){return <div className="brand"><Image className="brand-symbol" src="/monograma-dorado-lso.webp" width={1752} height={897} sizes="64px" alt="Monograma LSO" priority/><span className="brand-text">LEGAL<br/>SPECIAL <b>ONE</b></span></div>;}
export function Badge({children}:{children:React.ReactNode}){return <span className={`badge badge-${String(children).replaceAll(' ','-')}`}>{children}</span>;}
export function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <Dialog.Root open onOpenChange={open=>{if(!open)onClose();}}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="modal"><div className="modal-head"><Dialog.Title>{title}</Dialog.Title><Dialog.Close className="icon-button" aria-label="Cerrar"><X size={20}/></Dialog.Close></div><Dialog.Description className="sr-only">Formulario y detalles del entorno de demostración.</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function Empty({text='No hay registros para mostrar.'}:{text?:string}){return <div className="empty"><FolderOpen size={32}/><h3>{text}</h3><p>Cree un registro o ajuste los filtros para continuar.</p></div>;}
export function Section({title,href,children,linkLabel='Ver todos',variant='panel'}:{title:string;href?:string;children:React.ReactNode;linkLabel?:string;variant?:'panel'|'plain'}){return <section className={variant==='plain'?'section-plain':'panel'}><div className="panel-title"><h2>{title}</h2>{href&&<Link className="text-link" href={href}>{linkLabel}</Link>}</div>{children}</section>;}

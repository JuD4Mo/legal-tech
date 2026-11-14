# Implementación — Legal Special One

## Resultado

Demo frontend navegable de los cuatro módulos y las funciones transversales. Todos los registros y archivos operan localmente; no se configuraron servicios externos ni credenciales.

### Referencias examinadas

Las ocho imágenes reales no tienen los nombres enumerados en `AGENTS.md`. Se identificaron por su contenido:

| Archivo en `referencias/` (prefijo común «Imagen de ChatGPT 14 nov 2026,» ) | Contenido |
| --- | --- |
| `00_10_12.png` | Identidad LSO y paleta; referencia principal |
| `00_10_20.png` | Dashboard superior |
| `00_10_25.png` | Dashboard inferior |
| `00_10_30.png` | Clientes |
| `00_10_33.png` | Expedientes |
| `00_10_38.png` | Agenda |
| `00_10_54.png` | Documentos |
| `00_10_59.png` | Directorio/formularios |

Se conservaron los archivos originales. La UI utiliza exactamente `#101C2C`, `#C6A15B`, `#1D3557`, `#F7F8FA` y `#697586`, con derivados para superficies y estados. El símbolo utiliza `referencias/Monograma_dorado_entrelazado_LSO.png`, exportado sin deformación a WebP sin pérdida, junto al texto tipográfico original «LEGAL SPECIAL ONE». En el menú compacto se muestra solo el símbolo. El icono de pestaña PNG deriva del mismo monograma. No se reutilizaron nombres, datos personales, marca ni elementos comerciales de la aplicación de referencia.

## Decisiones técnicas

- **App Router con entrada `[[...route]]`:** rutas reales compartibles para listas y fichas, con la sesión demo resuelta únicamente en cliente. Next.js renderiza la estructura; no hay backend de negocio.
- **Repositorio local único:** IndexedDB mediante `idb`; el estado se guarda en una única clave para que registros, versiones y trazabilidad de cada operación se persistan conjuntamente. Sencillo y adecuado al volumen de la demo, no diseñado para grandes repositorios o edición concurrente entre pestañas.
- **Modelo explícito:** Organization, Member (identidad y membresía demo combinadas), Client, Matter, Task, LegalDocument, DocumentVersion, TimelineEntry, Notification y Log. Las interacciones del cliente y actuaciones del expediente comparten una línea de tiempo con vínculos explícitos.
- **Permisos:** matriz central en `permissions.ts`, con verificaciones también en el repositorio. El abogado consulta y opera sobre todos los registros de su espacio; no hay restricción por asignación individual en esta demo. El asistente tiene apoyo operativo sin borrados ni administración.
- **Formularios homogéneos:** definición de campos por dominio + Zod + validación HTML. Campos condicionados para persona jurídica y selectores de relaciones del espacio activo. Guardado asíncrono con errores explícitos y confirmación al descartar cambios.
- **Archivos:** límite individual de 10 MB, extensiones permitidas y blobs en IndexedDB. Toda versión conserva nombre original, autor, fecha y tamaño. La vista previa usa URL blob temporal y no un visor externo.
- **Documentos sembrados:** cuatro TXT reales y ficticios generados mediante Blob, por lo que las descargas iniciales sí existen.
- **Fechas:** fecha civil `YYYY-MM-DD`, hora separada y presentación `es-CO`/Bogotá; no se convierten las fechas sin hora a medianoche UTC. Semillas relativas al primer uso o restablecimiento.
- **Recordatorios:** se generan al acceder/cambiar perfil, evitando duplicados para la misma actividad y día. No hay temporizador de fondo, push ni envío de mensajes.
- **Identidad:** azules y dorado moderado, tipografía Manrope servida localmente, diálogos Radix, foco visible, menú móvil con Escape y control de foco, tablas convertidas en tarjetas en móvil.
- **Dependencias:** lockfile incluido. Se fijó una sustitución transitiva de `minimatch` en el parser de TypeScript para eliminar un aviso de seguridad del tooling; lint, tipos y pruebas se verifican con esa resolución.

## Matriz de aceptación

| Criterio | Implementación/verificación |
| --- | --- |
| Acceso demo y organización | Selección sin contraseña; prueba integral |
| Marca y paleta LSO | Tokens exactos, revisión de captura escritorio/móvil |
| Indicadores derivados | Dashboard lee clientes/expedientes/tareas reales; prueba crea y completa tarea y compara indicadores |
| CRM y ficha con interacciones | Alta/edición/conversión/desactivación, línea de tiempo, filtros y vínculos; prueba integral |
| Expedientes y actuaciones | Alta ligada al cliente, edición de estado/responsable y cronología; prueba integral |
| Archivo, vínculos y descarga | TXT e imagen cargados y descargados en Chromium; vista previa de imagen verificada |
| Versiones | Carga de versión 2, persistencia y descarga de versión 1 verificadas |
| Agenda conectada | Alta/edición/finalización/cancelación/borrado, calendario/lista; indicadores y vínculos verificados |
| Búsqueda y filtros | Resultados reales del espacio; pruebas de búsqueda global y filtros |
| Cambio de organización | Cambio de registros y búsquedas; escritura cruzada rechazada por pruebas de repositorio |
| Roles | Asistente sin administración/borrado; verificación de UI y comandos |
| Notificaciones y bitácora | Asignaciones, recordatorios internos y registro de mutaciones; pruebas de dominio |
| Persistencia/restablecimiento | Recarga después de CRUD y versionado; reset sin duplicar semillas |
| Temas/responsividad | Tema después de recarga, menú móvil y ancho 390 px sin desbordamiento |
| Calidad técnica | Scripts lint/typecheck/test/build y Playwright incluidos |

## Límites y pendientes honestos

- Se pueden editar las dos organizaciones existentes. No se incluyó creación de organizaciones adicionales ni un asistente de onboarding; era opcional y se priorizaron los cuatro módulos.
- Agenda mensual y lista; la vista semanal opcional no se implementó.
- No se incluyeron planes conceptuales ni catálogo de despachos separado. El despacho se ingresa manualmente en el expediente.
- Previsualización PDF dependiente del visor integrado del navegador; DOCX solo se descarga. Las pruebas automáticas de archivo cubren TXT e imágenes y versionado; no se verificó visualmente un PDF en todos los navegadores.
- Plantillas de ejemplo se editan y descargan como TXT; no son un editor DOCX, motor contractual, firma ni IA. Su contenido editado no se conserva entre aperturas salvo que se descargue y cargue como documento.
- Los recordatorios aparecen al entrar y solo para el usuario elegido; no notifican de forma confiable con la pestaña cerrada. Las fechas legales son responsabilidad del profesional.
- Las preferencias y la sesión se guardan localmente. Las semillas permanecen hasta restablecer; no se desplazan automáticamente las fechas después de cada recarga.
- IndexedDB es necesario. Un navegador sin almacenamiento habilitado muestra un error con reintento. Los errores de cuota durante una operación se muestran sin confirmar un guardado inexistente.
- El repositorio guarda un snapshot por operación; no implementa sincronización ni control de conflictos entre varias pestañas. Utilizar una pestaña durante la demostración.
- Solo se comprobó automáticamente Chromium en este entorno. No se afirma validación exhaustiva en Safari/Firefox, lector de pantalla ni certificación de accesibilidad.
- No se ejecutó un despliegue remoto. El build queda preparado para la importación estándar de Next.js en Vercel.
- Autenticación, aislamiento seguro, autorización en servidor, almacenamiento privado, backups, colaboración en tiempo real e integraciones externas están fuera de esta entrega.

## Ejecución de verificaciones

La implementación se verificó con Node.js 24.16 y npm 11.13. Se ejecutaron:

- `npm run lint`: sin errores ni advertencias.
- `npm run typecheck`: sin errores.
- `npm test`: 11 pruebas de dominio/repositorio aprobadas.
- `npm run test:e2e`: 10 pruebas de navegador en Chromium (4 flujos funcionales, 2 pruebas de arranque/alineación y 4 recorridos visuales/responsive en ambos temas).
- `npm run build`: compilación de Next.js de producción.
- `npm audit`: sin vulnerabilidades tras resolver la dependencia transitiva del tooling.

El navegador preconfigurado del MCP no estaba instalado y su instalación requería sudo; se utilizó Chromium descargado en el directorio de usuario y Playwright Test local, que sí permitió completar las pruebas.

## Refinamiento visual

Se consolidó la escala tipográfica, se simplificaron los encabezados y se sustituyeron los patrones decorativos del dashboard por indicadores compactos, filas de agenda reutilizables, una tabla de responsables y un historial en columnas. Los mismos principios se aplicaron a navegación, listados, fichas, formularios y notificaciones. Detalles y comprobaciones en [MEJORAS_UX.md](./MEJORAS_UX.md).

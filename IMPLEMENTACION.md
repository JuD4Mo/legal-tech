# Implementación — Legal Special One

## Resultado

Prototipo frontend con página pública, registro de abogados y clientes, sesiones locales y espacios de prueba generados por cuenta, además de los cuatro módulos profesionales y el Portal del Cliente. Los registros, publicaciones y mensajes operan localmente; no se configuraron servicios externos ni credenciales de servicios.

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
- **Repositorio local:** IndexedDB mediante `idb`; el estado profesional se guarda en `demo` y la extensión del portal en `portal-v1`, dentro del mismo almacén. Los comandos del portal actualizan su estado y la bitácora profesional en una sola transacción. El restablecimiento borra ambas claves atómicamente y vuelve a crear las semillas. Adecuado al volumen de la demo, sin sincronización colaborativa entre pestañas.
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

## Ampliación: Portal del Cliente

### Componentes y decisiones

- `types/portal.ts`: usuarios vinculados al CRM, invitaciones mediante estado `invitado`, concesiones usuario/expediente, borradores, etapas, conexiones, publicaciones históricas, archivos/versiones autorizadas, mensajes y notificaciones dirigidas. Los clientes, expedientes y blobs originales se reutilizan por identificador.
- `lib/portal-repository.ts`: carga aditiva sobre la misma IndexedDB, comandos transaccionales, comprobación de rol/organización/concesión en cada operación y proyección explícita de información publicable. Una conversación está identificada por la concesión usuario/expediente, por lo que dos representantes no ven las conversaciones privadas del otro.
- `lib/portal-session.ts`: interfaz sustituible de selección de identidad. La implementación demo guarda solo un identificador. No solicita ni almacena contraseñas, tokens de autenticación o claves API.
- `components/portal-context.tsx`: estado del portal, selector de perfiles, persistencia de selección, mensajes de error y actualización del espacio profesional después de operaciones locales.
- `features/portal-professional.tsx`: invitación/revocación en CRM, editor de etapas, reordenación, conexiones, adjuntos revisados, compromisos, vista previa por destinatario, historial de publicación y comunicaciones.
- `features/client-portal.tsx`: shell independiente sin módulos internos, dashboard, asuntos autorizados, seguimiento, documentos, mensajes, notificaciones y perfil. Las secciones se resuelven en navegación local de la experiencia, sin duplicar las rutas administrativas existentes.
- `features/portal-tracking.tsx`: explicaciones manuales, línea de tiempo seleccionable, diagrama SVG generado desde nodos/conexiones y alternativa textual. El diagrama admite conexiones hacia etapas anteriores y bifurcaciones; el orden visual no determina el orden jurídico. Descargas vuelven a verificar autorización y existencia del archivo.
- `app/portal.css`: estilos de la extensión con tokens existentes, tipografía local, tema oscuro y navegación horizontal móvil. Los diagramas tienen desplazamiento contenido, sin ensanchar la página.

### Publicación y documentos

La información interna del expediente no se transforma ni se publica automáticamente. El borrador es una preparación independiente. Publicar crea una instantánea revisada con el nombre/estado del asunto, las etapas visibles, conexiones entre etapas visibles, explicaciones, compromisos elegidos y referencias a versiones documentales específicas. La vista del cliente utiliza únicamente la última publicación y sus permisos actuales. Las revisiones anteriores permanecen en el historial profesional.

Un documento no seleccionado continúa siendo interno. La selección de un documento en una etapa visible indica que está revisado para compartir; la confirmación de publicación es la aprobación. Una nueva versión de archivo requiere otra publicación antes de ser consultable por el cliente. Si un archivo se elimina desde el módulo documental, su referencia histórica permanece y la consulta muestra que ya no está disponible; no inventa descargas. La mensajería solo adjunta versiones de la publicación actual.

La revocación no elimina publicaciones ni mensajes: desactiva la concesión, que se verifica al proyectar datos, enviar/leer mensajes y consultar archivos. Permite conservar el historial. Los registros con vínculos al portal deben archivarse/desactivarse en lugar de borrarse.

### Demostración inicial

Dos usuarios activos vinculados a **Isabela del Valle** y **Horizonte Creativo S.A.S.**, dos asuntos publicados con etapas completadas/actuales/previstas, documentos de ejemplo autorizados, mensajes de ambas partes y notificaciones. El asunto LSO-001 incluye una rama condicional y un retorno a preparación. Los demás documentos y actuaciones permanecen internos hasta su selección y publicación. Las invitaciones nuevas se aceptan desde el selector local sin credenciales.

### Límites y preparación para producción

| Componente | Implementado en la demo | Servicio real necesario |
| --- | --- | --- |
| Identidad e invitaciones | Selector y aceptación local sin contraseñas | Proveedor Auth, invitaciones verificables, sesiones y recuperación; p. ej. un adaptador posterior de Supabase Auth |
| Autorización | Comprobaciones frontend/repositorio y proyección por concesión | Verificación en cada consulta/comando del backend, aislamiento organizacional y control de sesiones revocadas |
| Documentos | Blobs locales, revisión explícita y versión fijada | Almacenamiento privado, autorización de descarga, validación de contenido y enlaces de corta duración |
| Mensajería | Conversación bidireccional al alternar perfiles en el mismo navegador | Backend persistente y transporte en tiempo real; gestión confiable de entrega/lectura |
| Notificaciones | Eventos persistidos localmente; compromisos según la revisión publicada | Procesamiento programado, entrega y preferencias; no hay alertas confiables con la pestaña cerrada |
| Auditoría | Eventos y revisiones locales editables por quien controle el navegador | Auditoría de servidor, integridad, retención, respaldo y restauración |
| IA | Solo interfaz `TrackingProposalService` con fuentes y revisión posterior | Servicio autorizado, protección de documentos y propuestas respaldadas por fragmentos; ninguna llamada externa en esta versión |

La agenda profesional puede cambiar después de una publicación: el cliente seguirá viendo la revisión aprobada hasta que se vuelva a publicar. Este comportamiento es deliberado para evitar compartir cambios internos sin revisar. El sistema no calcula términos, probabilidades ni resultados jurídicos.

La preparación de producción requiere revisar tratamiento de información jurídica y datos personales, autorizaciones, confidencialidad y normativa colombiana aplicable, incluida la Ley 1581 de 2012. Esta entrega no es un entorno seguro para datos reales.

### Verificación de la ampliación del portal (entrega anterior)

- Vitest: pruebas de migración idempotente, conservación de blobs existentes, aislamiento de usuarios/organizaciones, exclusión de borradores y etapas ocultas, fijación de versiones, revocación, múltiples representantes, aceptación, mensajería/lectura, notificaciones dirigidas, permisos de asistente y restablecimiento.
- Playwright: recorrido completo desde invitación y publicación con vista previa hasta aceptación, seguimiento/diagrama dinámico, descarga, conversación en ambas direcciones, recarga y revocación de expediente y portal.
- Playwright responsive: acceso directo desde la bienvenida, selección persistente, separación entre los dos clientes, modo oscuro y diagrama sin desbordamiento global en 390 × 844.
- Se conserva la suite previa de CRM, expedientes, agenda, archivos, indicadores, permisos y revisión visual.

Resultado de la verificación de esta ampliación:

| Comando | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias |
| `npm run typecheck` | Sin errores |
| `npm test` | **22 pruebas aprobadas**: 11 existentes y 11 del portal |
| `npm run build` | Compilación de producción de Next.js completada |
| `npm run test:e2e` | **12 pruebas aprobadas en Chromium**: 10 existentes y 2 del portal |
| `npm run format:check` | Todos los archivos comprobados cumplen el formato |
| `git diff --check` | Sin errores de whitespace |

Capturas de la ampliación: `portal-desktop.png`, `portal-mobile-dark.png` y `portal-revoked.png` dentro de los directorios de Playwright en `test-results/`. Se revisaron el dashboard claro de escritorio y el seguimiento/diagrama en móvil oscuro. No se realizó un despliegue remoto.

## Evolución: acceso público, cuentas locales y espacios generados

### Experiencias y navegación

- `/` es una página pública de presentación, con beneficios para ambos perfiles, registro diferenciado, login y acceso a la demostración rápida. Es visible aunque exista una sesión y no depende de que IndexedDB termine de inicializar para presentar el producto.
- `/registro/abogado` crea cuenta, organización propia, miembro administrador y datos de prueba relacionados; `/registro/cliente` crea una cuenta sin accesos por omisión y permite aceptar una invitación opcional.
- `/ingresar` verifica credenciales locales y abre `/dashboard` o `/portal`. La sesión persiste entre recargas. Cerrar sesión vuelve a la página pública y elimina las selecciones activas, conservando cuentas y datos.
- `/demo` conserva los perfiles ficticios iniciales, separados de las cuentas registradas. Sus selectores no enumeran cuentas o espacios privados recién creados. Las cuentas registradas no muestran controles para cambiar a otro usuario u organización.
- El cliente independiente ve un estado sin expedientes, puede introducir un código posteriormente o crear un contexto ficticio separado. Mi perfil permite seleccionar exclusivamente relaciones vinculadas a su cuenta, distinguiendo sus firmas del contexto ficticio.

### Nuevos límites de responsabilidad

| Archivo | Responsabilidad |
| --- | --- |
| `types/accounts.ts` | Cuentas, verificadores derivados, identidad local, registro e instantáneas coherentes |
| `lib/account-repository.ts` | Validación, registro/login, aceptación de códigos, generación idempotente y restablecimiento por espacio |
| `lib/passwords.ts` | Derivación/verificación PBKDF2 mediante Web Crypto, sin persistir contraseñas |
| `components/account-context.tsx` | Sesión, selección de relación, operaciones de cuenta y separación del modo rápido |
| `data/workspace-generator.ts` | Organizaciones, usuarios, CRM, expedientes, documentos/blobs, agenda, cronología, etapas, publicaciones, mensajes y notificaciones relacionados |
| `data/demo-invitations.ts` | Códigos de invitación reutilizables, destinatario, concesiones y vencimiento |
| `features/public-access.tsx` | Presentación del producto y formularios públicos |
| `features/client-account.tsx` | Bienvenida vacía, vinculación posterior, sandbox y restablecimiento propio |
| `app/public.css` | Página pública y formularios responsive con los tokens existentes |

### Persistencia y migración

Se conserva la versión 1 de IndexedDB y el almacén `state`. `accounts-v1` es una clave nueva; `portal-v1` incorpora `invitations` de forma aditiva sin borrar publicaciones ni blobs. No se crean contraseñas para los antiguos perfiles rápidos. Las selecciones antiguas pueden seguir utilizándose como identidad de demostración rápida.

La creación de cuenta/organización/datos, la aceptación de invitación y los restablecimientos se confirman en una transacción que actualiza `demo`, `portal-v1` y `accounts-v1`. La derivación criptográfica se hace **antes** de iniciar la transacción. Una invitación inválida durante el registro aborta la operación completa, sin dejar una cuenta o espacio parcial.

Las operaciones de cuenta emiten una instantánea de las tres estructuras tras la confirmación. Los contextos la aplican conjuntamente para evitar que un portal vea temporalmente un usuario actualizado con registros profesionales antiguos. Las mutaciones profesionales y del chat conservan sus adaptadores existentes.

### Generación de datos

- Cada abogado: un espacio con identificadores únicos, un administrador, cinco clientes, siete expedientes en estados variados, siete documentos TXT reales de muestra, catorce actividades, cronologías y ejemplos de seguimiento/conversaciones/invitaciones. Los procesos/documentos indican su carácter ficticio; los radicados no corresponden a registros reales.
- Cada sandbox de cliente: firma y abogada ficticias, un cliente, tres asuntos con sus documentos, etapas, compromisos, conversaciones y notificaciones. No se concede acceso a organizaciones ajenas para llenar el portal.
- El generador reutiliza las plantillas ficticias existentes y remapea identificadores y relaciones. Todas las actividades y archivos apuntan a expedientes/clientes del nuevo espacio y a su responsable. Las fechas se calculan en relación con la creación o el restablecimiento.
- Registro y exploración son idempotentes respecto de sus contextos: no se repiten durante carga/recarga. El correo identifica de forma única una cuenta local. Explorar otra vez reutiliza el sandbox existente.
- Restablecer un abogado regenera solo su organización y conserva su identidad/credenciales. Restablecer un cliente afecta solo a su sandbox, conservando los vínculos con abogados. El reset rápido restaura solo `andino` e `independiente`, conservando los nuevos espacios. Las cuentas de clientes cuyos accesos se borran siguen existiendo sin aquellos accesos.

### Invitaciones y permisos

Cada invitación tiene un código aleatorio `LSO-…`, destinatario normalizado, usuario del portal, organización, concesiones concretas, estado, vencimiento a siete días y cuenta que la aceptó. El correo de registro debe coincidir con el destinatario. No se aceptan identificadores de expedientes como códigos. Un código usado por la misma cuenta es idempotente mientras su autorización siga vigente; no puede ser utilizado por otra cuenta.

Generar otra invitación invalida las pendientes anteriores para ese destinatario. Revocar el acceso invalida las pendientes y las operaciones siguen comprobando las concesiones activas. Las cuentas registradas usan códigos; la aceptación sin credenciales queda limitada a los perfiles de la demostración rápida. No se envía correo ni se verifica la titularidad real de una dirección.

Las consultas de cada portal conservan sus filtros por organización y concesión. Las rutas administrativas no abren módulos profesionales para una cuenta cliente. El modo rápido solo permite sus espacios iniciales y los perfiles ficticios de estos. Esta separación es simulada y no reemplaza autorización en servidor.

### Credenciales y límites de producción

PBKDF2-SHA256 con 310.000 iteraciones, sal aleatoria por cuenta de 32 bytes y verificador de 256 bits. No se guardan la contraseña ni su confirmación en ninguna clave de IndexedDB/localStorage. Web Crypto requiere un contexto seguro (HTTPS o localhost). La sesión es una selección local, no un token confiable ni una garantía de identidad.

La interfaz `AccountRepository` y el contexto permiten sustituir la implementación local por un proveedor como Supabase Auth y servicios de PostgreSQL/almacenamiento privado. Producción necesitará validación de identidad/correo, invitaciones de servidor, sesiones seguras, recuperación de cuentas, autorización y aislamiento en cada consulta, almacenamiento privado, auditoría, respaldo y mensajería remota. El código local es inspeccionable/modificable por quien controle el navegador. No es adecuado para datos confidenciales ni contraseñas habituales.

### Recorridos de verificación añadidos

- Registro de abogado desde la página pública, CRM y expediente nuevos, archivo ficticio, etapa publicada e invitación generada desde su cliente.
- Registro del cliente con el código, acceso exclusivo al asunto, documento compartido y explicación aprobada.
- Mensaje del cliente, cierre/login del abogado, respuesta y nuevo login del cliente, verificando persistencia y protección de la experiencia ante rutas administrativas.
- Cliente sin invitación, rechazo de código arbitrario, exploración idempotente, recarga, restablecimiento propio y segunda cuenta sin accesos.
- Página pública, registro de ambos perfiles y login en 1440, 768 y 390 px, con textos principales de al menos 14 px y sin desbordamiento de la página.
- Pruebas de repositorio para sal/verificador, validación, destinatarios, caducidad, revocación, atomicidad, relaciones, espacios aislados, varias firmas y restablecimiento que conserva los espacios de otros usuarios.

### Resultado de las validaciones de esta evolución

| Comando | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias |
| `npm run typecheck` | Sin errores |
| `npm test` | **32 pruebas aprobadas** (dominio, portal y cuentas) |
| `npm run build` | Build de producción completado |
| `PLAYWRIGHT_PORT=3100 npm run test:e2e` | **16 pruebas aprobadas en Chromium**, ejecutadas contra el servidor de producción |
| `npm run format:check` | Formato conforme a Prettier |
| `git diff --check` | Sin errores de whitespace |

Se actualizaron los recorridos anteriores para abrir el selector rápido en `/demo`; la ruta `/` ahora se comprueba como página pública. Las pruebas nuevas incluyen vinculación durante el registro y posterior al registro, conversación entre cuentas distintas con cierres/login, sandbox idempotente y pantallas públicas en escritorio/tablet/móvil. Se revisaron capturas del inicio público, formulario móvil y portal del sandbox. No se ejecutó un despliegue remoto ni se validaron Safari/Firefox en esta entrega.

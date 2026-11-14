# PROMPT MAESTRO PARA CODEX — LEGAL SPECIAL ONE

## 0. Instrucción principal y forma de trabajo

Actúa como **ingeniero de software senior, arquitecto frontend y diseñador de producto SaaS B2B**, con especialización en Next.js, TypeScript, React, Tailwind CSS, experiencia de usuario y aplicaciones LegalTech. Tu tarea no es elaborar una propuesta teórica: **debes construir en este repositorio una aplicación web real, navegable, visualmente pulida y funcional como demostración**, lista para ejecutarse localmente y desplegarse en **Vercel**.

**Trabaja de forma autónoma.** Inspecciona primero el repositorio y las imágenes disponibles, establece un plan de implementación breve, escribe el código, instala dependencias, ejecuta validaciones, corrige errores y entrega el resultado funcional. No te detengas en la planificación ni esperes nuevas instrucciones para implementar las secciones definidas. Ante decisiones técnicas menores, escoge la opción más sencilla, mantenible y consistente con este documento y documenta las decisiones. No declares una función terminada si no funciona.

**Prioridad absoluta:** el proyecto es una **demo de producto 100 % frontend**. NO implementes por ahora backend propio, API persistente, Supabase, PostgreSQL, autenticación real, pagos, servicios externos, envío real de correos, almacenamiento en la nube ni integraciones judiciales. Toda la experiencia debe poder probarse en un navegador con **datos ficticios y persistencia local**; debe compilar y poder publicarse en Vercel sin configurar secretos ni servicios adicionales. La arquitectura debe facilitar la sustitución futura del repositorio local por una API, pero no construyas esa API ahora.

## 1. Producto y propósito

**Nombre:** LEGAL SPECIAL ONE (también utilizable como “Legal Special One” en textos secundarios).

**Eslogan:** “La gestión jurídica, en un solo lugar.”

**Categoría:** LegalTech, software de gestión jurídica SaaS.

**Mercado inicial:** Colombia.

**Públicos:** (a) abogados independientes; (b) firmas con administradores, abogados y asistentes jurídicos.

**Propósito:** centralizar la relación con clientes, la administración de asuntos jurídicos, la documentación y la agenda de vencimientos y tareas. El usuario debe poder pasar fluidamente de un cliente a sus expedientes, de un expediente a sus documentos y de allí a sus actuaciones y actividades.

**Valores de marca:** profesionalismo, confianza, autoridad, orden, exclusividad, innovación, modernidad y sencillez. La plataforma es una herramienta de gestión, NO un sistema que sustituya el criterio profesional ni garantice el cumplimiento de términos legales.

## 2. Referencias visuales y jerarquía de importancia

Las imágenes están en el directorio `referencias/` de este paquete. **Antes de diseñar, examina las ocho.** La primera tiene prioridad sobre todas las demás.

- `01-brand-identidad-paleta.png`: **FUENTE PRINCIPAL Y OBLIGATORIA DE IDENTIDAD**. Muestra logotipo/monograma LSO, marca, estilo premium, azul noche y dorado; esta es la referencia EXACTA de colores. No reproduzcas la imagen completa como interfaz.
- `02-dashboard-superior.png`: referencia orientativa de distribución general, sidebar, barra de búsqueda, encabezado, tarjetas KPI.
- `03-dashboard-inferior.png`: referencia orientativa de métricas, bloques secundarios, actividades y vencimientos.
- `04-clientes.png`: referencia orientativa de tabla de CRM, filtros y botones de creación.
- `05-expedientes.png`: referencia orientativa de tabla de expedientes, filtros y prioridades.
- `06-agenda.png`: referencia orientativa de lista de tareas y vencimientos.
- `07-documentos.png`: referencia orientativa de repositorio y carga de documentos.
- `08-directorio-entidades.png`: referencia orientativa de formularios, campos y estructura de directorio.

**Regla:** las imágenes 2–8 **NO son la marca ni el diseño definitivo**; proceden de un producto de referencia llamado Juridesk. **NO copiar** su nombre, logo, escudo, datos personales, textos de ejemplo, colores verdes, ni elementos innecesarios. Inspirarse solo en su arquitectura visual y patrones de uso. Toda la interfaz final debe tener identidad propia y visible de **LEGAL SPECIAL ONE**.

### Paleta oficial (usar exactamente estos hexadecimales)

| Token | Color | HEX | Uso recomendado |
|---|---|---|---|
| `navy-950` | Azul Noche | `#101C2C` | Sidebar, superficies oscuras, títulos de alta jerarquía |
| `gold-500` | Dorado | `#C6A15B` | Marca, acentos, bordes, iconografía selectiva, estado activo |
| `blue-800` | Azul Institucional | `#1D3557` | Botones principales, enlaces, gradientes, foco secundario |
| `surface` | Blanco Cálido | `#F7F8FA` | Fondo principal claro |
| `slate-500` | Gris Neutro | `#697586` | Texto secundario y elementos neutros |

Se permiten tonos derivados transparentes o mediante mezcla para bordes, superficies y estados, sin cambiar los colores base de marca. Mantener contraste accesible: **no utilizar dorado sobre blanco para textos pequeños**. Preferir texto azul oscuro sobre fondos claros y blanco sobre fondos azules. Emplear el dorado con moderación como acento premium, nunca como saturación general.

### Dirección de arte del producto

- Sidebar elegante en azul noche (`#101C2C`) con monograma o identificación LSO; texto claro, iconos discretos y activo resaltado con un acento dorado y fondo azul institucional.
- Barra superior con búsqueda global, notificaciones, selector de espacio de trabajo, alternancia claro/oscuro y menú de usuario.
- Encabezados de módulo tipo banner con gradiente sobrio entre azul noche y azul institucional, título blanco y pequeño descriptor dorado.
- Área principal de color blanco cálido, tarjetas claras, esquinas redondeadas moderadamente, sombras tenues, bordes finos y buena separación.
- Tipografía sans-serif moderna, legible y sobria; escalas coherentes, buena jerarquía, estados hover/focus/disabled y microinteracciones discretas.
- Opcionalmente integrar un motivo geométrico tenue alusivo a las balanzas de justicia en la pantalla de acceso, sin convertir el sistema en una página publicitaria recargada.
- Diseñar una versión propia y de buena calidad del monograma “LSO” si puede reconstruirse razonablemente como SVG; no deformar ni presentar un recorte borroso de la referencia como si fuera el logotipo final. Si la reconstrucción exacta no es viable a partir de la imagen rasterizada, usar una **alternativa tipográfica limpia** con “LSO | LEGAL SPECIAL ONE”. No utilizar el logo Juridesk bajo ninguna circunstancia.
- Etiquetas, navegación y mensajes en **español colombiano**. Formatos de fecha localizados a Colombia, con zona horaria `America/Bogota`; no conservar valores de ejemplo de las capturas.

## 3. Alcance estricto de esta entrega: prototipo frontend funcional

Implementar una **aplicación SaaS demostrativa** con los cuatro módulos centrales y componentes transversales:

1. **CRM de clientes y prospectos.**
2. **Gestión de expedientes/asuntos jurídicos.**
3. **Gestión documental.**
4. **Agenda, tareas y vencimientos.**

Transversalmente: acceso demo/onboarding, espacios de trabajo, roles simulados, dashboard, búsqueda global, notificaciones internas, historial de actividad, perfil y ajustes básicos.

**Fuera de alcance en esta versión:** backend de producción; Supabase/Postgres; login real o restablecimiento real de contraseñas; invitaciones por correo; pagos o suscripciones reales; facturación y costos; firma electrónica/digital con validez jurídica; IA o documentos “con IA”; cálculos automáticos de términos judiciales; extracción de datos de páginas judiciales; integraciones con juzgados, calendarios, correo y mensajería; servicios de escaneo de cámara; portal del cliente y app móvil nativa. **No implementar módulos vacíos que aparenten tener esas capacidades.**

La referencia de directorio de juzgados/entidades puede inspirar un **catálogo local simple de despachos judiciales para seleccionar al crear un expediente**, si es útil, pero no debe desplazar los cuatro módulos centrales. Las plantillas documentales en el MVP son plantillas estáticas/editables manualmente; no IA.

### Requisito irrenunciable de una demo honesta

Dejar visible un aviso discreto en acceso o ajustes: **“Entorno de demostración. Los datos se guardan en este navegador. No utilice información real o confidencial.”** Todas las personas, números de radicado, entidades, casos y fechas sembradas deben ser claramente ficticios. No mostrar “autenticación segura”, “firma digital válida”, “datos cifrados en la nube” o “notificación enviada” si esas capacidades no existen. Tampoco indicar que organizaciones diferentes están protegidas a nivel servidor: la separación de datos será **únicamente simulada en el navegador**.

## 4. Tecnología y arquitectura

- **Next.js** con App Router, **React**, **TypeScript estricto** y **Tailwind CSS**; usar versiones estables compatibles en el momento de implementación y respetar la estructura existente del repositorio si ya hay código útil.
- Componentes visuales consistentes, preferiblemente apoyados en **shadcn/ui o Radix UI** y **Lucide** para iconos, evitando estilos genéricos de plantilla.
- **React Hook Form + Zod** (o equivalente homogéneo) para formularios y validación.
- Utilidades de fechas con soporte de `es-CO`/zona horaria Bogotá; evitar errores al convertir fechas sin hora.
- Arquitectura modular por dominio, con tipos, componentes, casos de uso simples, repositorios/interfaces de datos y adaptador de persistencia local. **No acoplar páginas directamente a llamadas dispersas de `localStorage`.**
- Persistencia durable en el navegador usando **IndexedDB** (preferentemente mediante `idb` o equivalente) para registros y archivos de prueba, y `localStorage` solo para preferencias pequeñas (tema, organización seleccionada, sesión de demo), si conviene. Nunca guardar archivos grandes en Base64 dentro de `localStorage`.
- Cuidar el renderizado en servidor: no consultar `window`, `document`, `localStorage` o `indexedDB` antes de estar en el cliente. No causar errores de hidratación.
- Ninguna variable de entorno secreta o servicio de terceros debe ser indispensable para ejecutar/deplegar.
- Preparar para despliegue estándar en Vercel; no es necesario montar servidor o contenedores.

La organización concreta de carpetas queda a tu criterio, pero debe diferenciar `app/`, `components/`, `features/` o `modules/`, `lib/`, `types/`, `data/` y `public/` si son necesarias. Evitar sobreingeniería y dependencias sin beneficio tangible.

### Modelo de dominio mínimo

Diseñar tipos y relaciones explícitas, con `id`, `organizationId`, `createdAt`, `updatedAt`, creador/responsable cuando corresponda:

- `Organization`: nombre, modalidad (`individual`/`firma`), estado demo, preferencias.
- `User` / `Membership`: identidad ficticia, nombre, correo demo, rol, organización, estado.
- `Client`: persona natural o jurídica, documento/NIT, contacto, ciudad, dirección opcional, notas, estado (`prospecto`, `activo`, `inactivo`), representante si aplica, etiquetas.
- `Interaction`: cliente, tipo (llamada, correo, reunión, nota), fecha, responsable, descripción.
- `Case` / `LegalMatter`: código interno, título, cliente, radicado opcional, clase de proceso, juzgado/despacho, partes, abogado responsable, estado, prioridad, descripción, fechas relevantes.
- `CaseActivity`: expediente, fecha, tipo, detalle, usuario responsable; cronología del asunto.
- `Document`: nombre, categoría, tipo MIME, tamaño, cliente y/o expediente vinculado, carpeta lógica, creador, fecha, versión actual, referencia local al archivo.
- `DocumentVersion`: documento, versión, fecha, autor y blob/archivo local.
- `CalendarItem` / `Task`: tipo (audiencia, reunión, tarea, vencimiento, recordatorio), título, descripción, fecha/hora o fecha límite, responsable, estado, prioridad, referencia a expediente y/o cliente, recordatorio configurado.
- `Notification`: destinatario, título, descripción, tipo, fecha, leído/no leído, enlace interno.
- `ActivityLog`: organización, actor, acción, tipo de recurso, recurso relacionado, fecha y descripción breve.

Definir claves y relaciones consistentes. Mostrar nombres legibles en lugar de identificadores técnicos. Evitar borrados que dejen relaciones rotas: confirmar y, según el caso, impedir borrar un cliente con expedientes o aplicar archivado lógico.

## 5. Flujos de usuario obligatorios

### 5.1. Acceso y espacios de trabajo

Crear una pantalla de bienvenida/acceso con identidad Legal Special One, eslogan y estado explícito de demo. Debe permitir **entrar directamente como usuario demo** y escoger una organización/persona preconfigurada; también puede mostrar una **simulación visual** de registro/creación de espacio de trabajo, sin credenciales reales ni tratamiento de contraseñas como si fueran seguras. Si se incluye formulario de contraseña, no conservar contraseñas reales ni inventar un sistema de autenticación robusto. Priorizar un acceso demo sin fricción.

Incluir:

- Espacio “Consultorio Jurídico Andino” (firma ficticia) con administrador, abogado y asistente.
- Espacio “Estudio Jurídico Independiente” (abogado individual ficticio).
- Alternar organización y rol demo para verificar la interfaz y sus permisos simulados.
- Crear y editar una organización demo desde ajustes si es razonable; seleccionar espacio de trabajo actual.
- Persistir la selección de usuario/espacio durante recargas; opción “Salir de la demo” para regresar al acceso.

**Separación simulada:** todas las consultas y operaciones del repositorio local deben estar filtradas por `organizationId`. Cambiar de organización debe cambiar clientes, asuntos, documentos, actividades y notificaciones, sin mezclar registros en la UI. Aclarar que esto no es aislamiento seguro de producción.

### 5.2. Dashboard

Diseñar un dashboard premium y visualmente similar en **composición** a las imágenes de referencia, pero con marca LSO y nueva paleta:

- Saludo al usuario y contexto de su organización.
- KPI con total de clientes, expedientes abiertos, tareas pendientes y próximas audiencias/vencimientos.
- Bloques útiles: próximos vencimientos, agenda próxima, expedientes por responsable, actividad reciente, últimos documentos, distribución de estados (si agrega valor).
- Acciones rápidas: “Nuevo cliente”, “Nuevo expediente”, “Nueva actividad”, “Subir documento”.
- Los conteos y listas **deben derivarse de los datos locales reales de la demo** y actualizarse tras crear, editar o completar registros; no usar métricas estáticas independientes.
- Fechas de ejemplo relativas a la fecha actual para que el panel se mantenga útil en el futuro.
- Estados vacíos orientativos y enlaces a los módulos asociados.

### 5.3. Módulo 1 — CRM de clientes

Implementar páginas de lista, alta, detalle y edición:

- Crear, editar, consultar, filtrar, buscar y archivar/desactivar clientes y prospectos.
- Persona natural/jurídica, tipo y número de documento o NIT, nombre/razón social, contacto, teléfono, correo, ciudad, dirección, representante legal cuando aplique, etiquetas y notas.
- Validaciones claras de datos requeridos, formato de correo, duplicados razonables dentro de la organización y campos condicionados por tipo de persona.
- Filtros por tipo, estado, etiquetas, búsqueda por nombre/documento/correo; ordenación y paginación si hace falta.
- Ficha de cliente con información general, línea de tiempo de interacciones, expedientes vinculados y documentos vinculados.
- Registrar llamadas, reuniones, correos y notas como **interacciones manuales**; no enviar mensajes reales.
- Convertir un prospecto en cliente activo.
- Acciones contextuales para “Crear expediente para este cliente” y “Agregar actividad”.

### 5.4. Módulo 2 — Expedientes y procesos jurídicos

Implementar listado, alta, ficha y edición:

- Código interno, título/asunto, cliente vinculado, radicado, tipo o clase de proceso, despacho/juzgado, partes involucradas, abogado asignado, estado, prioridad y resumen.
- Estados consistentes (p. ej., `abierto`, `en seguimiento`, `suspendido`, `cerrado`, `archivado`) y prioridades (`baja`, `media`, `alta`, `urgente`) con etiquetas visuales.
- Búsqueda por código, título, radicado, cliente y abogado; filtros por estado, prioridad, tipo y responsable.
- En la ficha: resumen, participantes, responsable, notas, **cronología de actuaciones internas**, documentos asociados, próximos compromisos y enlaces al cliente.
- Registrar actuaciones/manuales con fecha, descripción, tipo y usuario; editarlas o eliminarlas con confirmación según permisos.
- Cambiar estado/asignar abogado y reflejarlo en las estadísticas del dashboard.
- Registrar radicados como datos proporcionados manualmente; NO consultar automáticamente plataformas judiciales.
- Poder crear tareas, audiencias o vencimientos vinculados desde la ficha del expediente.

### 5.5. Módulo 3 — Gestión documental

- Repositorio con vista de lista, búsqueda por nombre/categoría, filtros por cliente/expediente/tipo, orden y metadatos.
- Subir archivos de prueba desde el navegador (al menos PDF, imágenes, DOCX si el navegador los permite); almacenarlos **localmente en IndexedDB** cuando sea viable y conservar su relación con el expediente y cliente.
- Mostrar límites sensatos de tamaño para la demo, validación del tipo de archivo y errores claros ante falta de cuota del navegador.
- Permitir descargar el archivo local; previsualizar PDF e imágenes cuando sea compatible sin servicios externos; no prometer vista previa para todos los formatos.
- Categorías/carpetas lógicas (p. ej., contratos, memoriales, pruebas, providencias, correspondencia, otros).
- Editar nombre, categoría y vínculos; registrar fecha de carga, autor y tamaño.
- **Versionado sencillo:** subir una nueva versión de un documento y consultar/descargar versiones anteriores, manteniendo historial.
- Plantillas básicas de texto para memorial/contrato como contenido genérico de ejemplo editable y descargable, con advertencia de revisión profesional; sin IA y sin afirmar validez jurídica.
- Mostrar estado vacío y enlazar la carga desde un expediente o ficha de cliente.

### 5.6. Módulo 4 — Agenda, tareas y vencimientos

- Vistas **calendario mensual** y **lista**; vista semanal si resulta viable sin sacrificar calidad.
- Crear, consultar, editar, completar/cancelar y eliminar actividades; tipos audiencia, reunión, tarea, vencimiento, recordatorio.
- Campos: título, descripción, fecha y hora (o fecha límite), responsable, estado, prioridad, recordatorio y cliente/expediente asociados opcionales.
- Filtrar por tipo, período, responsable, estado y prioridad; mostrar vencidas, próximas, del día y completadas con claridad.
- Interacciones útiles desde tarjetas: “Marcar como completada”, “Editar”, “Ver expediente”.
- Recordatorios **simulados dentro de la aplicación** basados en fechas, visibles como avisos o notificaciones cuando el usuario entra. No enviar correos, SMS ni push.
- **No calcular automáticamente términos judiciales.** La fecha de vencimiento será ingresada y verificada por el abogado. Añadir indicación clara: “Los términos y vencimientos deben ser verificados por el profesional responsable”. No prometer alertas confiables cuando la pestaña está cerrada.
- Mantener consistencia entre la agenda, el dashboard y la ficha de expediente.

## 6. Funcionalidades transversales

### 6.1. Navegación y búsqueda global

Sidebar con: Dashboard, Clientes, Expedientes, Documentos, Agenda; sección secundaria de Equipo/Usuarios, Actividad y Configuración. No incluir Facturas, Costos, IA, Escáner ni módulos no implementados solo porque aparezcan en las capturas.

Topbar con buscador global que devuelva, en una misma interfaz, **clientes, expedientes y documentos** del espacio activo. Resultados con tipo, título, contexto y navegación real al detalle. Implementar búsquedas en datos locales, no simular respuestas fijas. Usar atajo `Ctrl/Cmd + K` si es sencillo y accesible.

### 6.2. Usuarios, roles y permisos (solo simulados)

Roles iniciales:

- **Administrador:** acceso total al espacio demo, creación/edición de miembros, configuración y consulta de actividad.
- **Abogado:** acceso a clientes, expedientes, documentos y agenda de acuerdo con sus asignaciones/reglas demo; puede modificar información operativa.
- **Asistente jurídico:** consulta y apoyo operativo; permisos limitados para operaciones sensibles (p. ej. no administrar miembros ni configuración general, no borrar expedientes).

Implementar una matriz de permisos en código y usarla consistentemente para ocultar/deshabilitar operaciones; también verificar permisos en las funciones del repositorio local. Mostrar mensajes claros al no tener autorización **dentro de la demo**. Permitir cambiar de rol desde un control de pruebas. **No confundir estas comprobaciones frontend con protección real de datos.**

### 6.3. Notificaciones internas y trazabilidad

- Centro de notificaciones con ícono, contador, estados leída/no leída y navegación asociada.
- Notificaciones locales por tareas asignadas, próximos vencimientos, cambios relevantes y alertas de ejemplo.
- Historial de actividad consultable, con acción, actor, recurso y fecha, actualizado al crear/editar/cambiar estados.
- No registrar contraseñas ni contenido documental sensible en la bitácora; solo metadatos breves.

### 6.4. Configuración y planes

- Perfil demo (nombre, avatar iniciales, rol, organización).
- Ajustes sencillos de organización, miembros y preferencias de interfaz.
- Modo claro/oscuro funcional y persistente. Ambos temas deben respetar la identidad azul y dorado.
- Se puede mostrar una sección **informativa y no transaccional** con los tres planes conceptuales: Individual, Profesional y Firma. Sin precios inventados, pasarelas de pago, periodos de prueba fingidos ni banners de “suscripción suspendida”. Si distrae del MVP, omitirla.
- Botón “Restablecer datos de demostración” con confirmación, restableciendo datos ficticios iniciales. Indicar que los datos del navegador se borrarán.

## 7. Diseño detallado y usabilidad

- **Desktop:** sidebar estable con opción de colapsar, topbar, contenido con ancho fluido y densidad adecuada para herramientas administrativas.
- **Tablet:** navegación compacta y tablas adaptadas.
- **Móvil:** drawer lateral accesible, búsqueda utilizable, formularios a una columna, tarjetas/listas alternativas cuando las tablas no quepan. Evitar overflow horizontal de toda la página.
- Pantallas de alta calidad: acceso, dashboard, listas, fichas, formularios, diálogos confirmatorios, estados vacíos, error y carga.
- Componentes reutilizables: `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `StatCard`, `DataTable`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `EntityPicker`, `Timeline`, `FormField` y `NotificationCenter`, o equivalentes.
- Formularios con campos etiquetados, mensajes de validación junto al campo, controles de guardado/cancelación, toasts por acciones y prevención razonable de pérdida de cambios.
- Accesibilidad: navegación por teclado, foco visible, etiquetas de controles, contraste adecuado, semántica correcta y diálogos accesibles.
- Consistencia: usar el mismo vocabulario, formatos y estados en todos los módulos. “Expediente” como concepto de interfaz principal; “proceso jurídico” puede figurar como descripción o tipo de asunto.
- Mostrar ejemplos de Colombia (nombres ficticios, ciudades, clases de procesos plausibles) sin usar información real de personas de las capturas.
- Evitar páginas decorativas sin implementación, botones inertes, enlaces rotos, textos lorem ipsum y datos ficticios que no se puedan modificar.

## 8. Datos de demostración y comportamiento

Al acceder por primera vez al navegador, cargar **semillas idempotentes** de al menos:

- 2 organizaciones ficticias (una firma y un independiente).
- 1 administrador, 1 abogado y 1 asistente en la firma; un abogado individual en el otro espacio.
- 8–12 clientes/prospectos repartidos entre organizaciones.
- 8–12 expedientes con distintos estados, responsables y prioridades, relacionados con clientes.
- 12–18 actividades/tareas/audiencias/vencimientos distribuidos entre próximas, vencidas y completadas; fechas calculadas relativamente al día actual.
- Una cronología razonable de interacciones, actuaciones y bitácora.
- 3–5 documentos de muestra **como metadatos claramente marcados**; si no hay archivos binarios reales, no ofrecer descarga de archivos inexistentes. Se pueden generar archivos de ejemplo desde el navegador o permitir que el usuario suba los suyos.

No insertar los nombres/correos/documentos de las capturas. Los registros sembrados pueden ser editados o eliminados con las mismas reglas que los nuevos.

**Persistencia verificable:** crear un cliente, expediente, documento y tarea; recargar; comprobar que se conservan. Completar una tarea debe alterar el dashboard. Cambiar organización debe mostrar otros datos. Restablecer demo debe restaurar las semillas sin duplicarlas.

Si el navegador no permite IndexedDB o alcanza cuota, mostrar un mensaje explícito y manejar el error sin bloquear toda la interfaz.

## 9. Calidad técnica, protección y límites de la demo

- Mantener TypeScript estricto, tipos de dominio claros y separación lógica entre presentación, datos locales y lógica de aplicación.
- Usar validaciones de formularios y control básico de límites/tipos de archivos.
- Evitar `dangerouslySetInnerHTML` con contenido de usuario, almacenamiento de contraseñas, uso innecesario de HTML no sanitizado y dependencias excesivas.
- Asegurar manejo de errores, estados de carga y confirmaciones en operaciones destructivas.
- No registrar ni mostrar datos privados tomados de las imágenes de referencia.
- **Importante:** una demo frontend publicada en Vercel **no ofrece autenticación, autorización, aislamiento multiempresa ni almacenamiento documental seguro de producción**. Incorporar esta limitación en el README y en el aviso de demo. No solicitar que personas carguen información jurídica real.
- Arquitectura pensada para reemplazar almacenamiento local por servicios seguros en una segunda etapa; en esa fase sería necesario revisar cumplimiento colombiano, Ley 1581 de 2012, seguridad de datos, autenticación, control de acceso en servidor, backups, almacenamiento privado, auditoría real, restauración y disponibilidad. **Nada de eso debe fingirse implementado ahora.**

## 10. Pruebas y criterios objetivos de aceptación

Antes de concluir, ejecutar los scripts disponibles para **lint, typecheck y build** y corregir los errores reales. Añadir pruebas razonables (Vitest/Testing Library o equivalentes, sin inflar el proyecto) para lógica de permisos, validación y repositorios locales; pruebas de navegación/smoke con Playwright si el entorno las permite. Si alguna herramienta no está disponible, documentar exactamente qué no pudo ejecutarse.

Verifica manualmente o mediante pruebas, como mínimo:

1. Se abre el acceso demo y se entra en un espacio de trabajo.
2. Se ve **LEGAL SPECIAL ONE**, no Juridesk; la paleta de la primera imagen se respeta en las pantallas.
3. Dashboard presenta cifras obtenidas de los registros, no números constantes sin relación.
4. Crear/editar un cliente funciona; su ficha muestra sus interacciones.
5. Crear un expediente vinculado a un cliente funciona; se puede editar su estado y agregar actuaciones.
6. Subir un archivo de prueba, vincularlo, volver a encontrarlo y descargarlo funciona dentro de las capacidades del navegador.
7. Se puede crear una nueva versión de documento y consultar la anterior.
8. Crear, editar y completar una tarea actualiza agenda, expediente vinculado y dashboard.
9. La búsqueda global y los filtros entregan registros reales del espacio activo.
10. Cambiar entre organizaciones no mezcla registros en vistas ni búsquedas.
11. Cambiar a asistente restringe acciones de administrador; no hay botones que hagan operaciones no permitidas.
12. Las notificaciones y el historial responden a eventos locales.
13. Tras recargar, las operaciones persisten; “Restablecer demo” recupera los registros iniciales.
14. El tema claro/oscuro, el sidebar móvil, las tablas/formularios y los estados vacíos son utilizables.
15. `npm run build` (o el gestor/scripts elegidos) finaliza correctamente y el proyecto está listo para desplegar en Vercel.

## 11. Entregables dentro del repositorio

Entregar **código completo y ejecutable**, no solo un diseño o una explicación. Además:

- `README.md` actualizado en español: resumen del producto, stack, cómo instalar y ejecutar, cómo acceder a usuarios/organizaciones de prueba, detalles de persistencia local, limitaciones de la demo y explicación de la arquitectura.
- Instrucciones concisas para **deploy en Vercel** (importar repo, framework Next.js, build y sin variables secretas obligatorias); si tienes acceso/permiso real para desplegar, puedes hacerlo, pero si no, deja el repositorio preparado y nunca afirmes que ya está publicado.
- Un archivo `IMPLEMENTACION.md` o sección del README con funcionalidades realizadas, pendientes honestos y decisiones técnicas principales.
- Scripts coherentes de desarrollo, lint, tipos, pruebas y build; configuración clara de dependencias.
- Código organizado, comentarios solo donde agreguen claridad, sin secretos ni credenciales.

## 12. Orden recomendado de ejecución

1. Inspeccionar proyecto existente e imágenes. Identificar si ya hay código aprovechable; no sobrescribir trabajo útil innecesariamente.
2. Definir tokens de diseño y crear layout general, navegación responsive, componentes compartidos y acceso a demo.
3. Establecer modelo de dominio, semillas locales, repositorios, sesiones/organizaciones y permisos simulados.
4. Implementar CRM completo, luego expedientes, luego documentos y después agenda, validando cada flujo.
5. Conectar dashboard, búsqueda global, notificaciones, bitácora y configuración.
6. Mejorar estados vacíos, responsividad, accesibilidad, coherencia de datos y acabado visual.
7. Ejecutar pruebas, corregir fallos de lint/tipos/build y actualizar README.
8. Resumir lo realmente construido y cómo probarlo, con advertencias de que es frontend demo.

## 13. Criterio de excelencia de la entrega

El resultado debe sentirse como **el primer producto demostrable de una startup LegalTech premium**, no como un boceto, landing page o conjunto de maquetas estáticas. Debe verse sólido, navegable y conectado en datos. El diseño debe reflejar **fielmente la identidad visual de la primera imagen** y reinterpretar de forma propia y elegante los patrones de las siete capturas siguientes. **Las operaciones principales deben funcionar dentro del navegador**, sin servidores ni dependencias ocultas, y el proyecto debe poder desplegarse en Vercel.

**Comienza implementando. No te limites a responder con una descripción o un plan.**

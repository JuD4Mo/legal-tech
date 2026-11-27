# LEGAL SPECIAL ONE

**La gestión jurídica, en un solo lugar.**

Prototipo funcional de una plataforma de gestión jurídica para abogados independientes, firmas y sus clientes en Colombia. Incluye página pública, registro diferenciado, cuentas locales, generación automática de espacios de prueba, CRM, expedientes, documentos, agenda y **Portal del Cliente** con seguimiento visual y conversaciones locales.

> **Entorno de demostración. Los datos se guardan en este navegador. No utilice información real o confidencial.** No existe autenticación real, autorización en servidor, aislamiento multiempresa seguro ni almacenamiento documental de producción.

## Ejecutar localmente

Requiere **Node.js 22.13+** (recomendado Node.js 24 LTS) y npm.

```bash
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). No requiere variables de entorno, credenciales, base de datos remota ni servicios externos. La tipografía se sirve desde el proyecto, sin consultas a Google Fonts.

Para comprobar la versión de producción:

```bash
npm run build
npm start
```

## Página pública, registro e inicio de sesión

La ruta **`/`** presenta el producto y las opciones **Registrarme como abogado**, **Registrarme como cliente**, **Iniciar sesión** y **Probar Legal Special One**. Siempre permanece pública, incluso cuando hay una cuenta abierta.

| Ruta | Experiencia |
| --- | --- |
| `/registro/abogado` | Cuenta local de abogado, modalidad independiente/firma y espacio propio |
| `/registro/cliente` | Cuenta local de cliente, con invitación opcional |
| `/ingresar` | Login común; redirige según el perfil |
| `/dashboard` | Portal profesional |
| `/portal` | Portal del Cliente o bienvenida sin expedientes |
| `/demo` | Selector explícito de los perfiles ficticios iniciales, sin registro |

### Probar el flujo comercial simulado

1. Registrar un abogado con nombre, apellido, correo y **contraseña exclusiva de prueba** (al menos 8 caracteres). Elegir independiente o firma; en este último caso, indicar un nombre para el espacio.
2. Se crea un administrador y una organización propia con **5 clientes, 7 expedientes, 7 documentos TXT ficticios, 14 actividades**, actuaciones, etapas/relaciones, publicaciones y conversaciones de ejemplo. Las fechas son relativas a la creación del espacio.
3. Desde **Clientes → ficha → Invitar al Portal**, indicar el correo ficticio que utilizará el cliente al registrarse, seleccionar expedientes y permisos y generar una invitación.
4. Copiar el **código LSO** que aparece en la ficha. Tiene destinatario concreto, permisos definidos y vigencia de siete días; no se envía correo.
5. Cerrar sesión y registrar al cliente con ese mismo correo. Introducir el código durante el registro o posteriormente en **Mi perfil → Vincular invitación de mi abogado**. Una cuenta sin invitación empieza sin expedientes ni vínculos a otros usuarios.
6. Consultar el expediente publicado y enviar un mensaje. Cerrar sesión, ingresar con la cuenta del abogado y responder desde **Comunicaciones**. Al volver a ingresar como cliente, la respuesta estará en la misma conversación local.

También puede crear primero la cuenta del cliente, dejarla sin expedientes y vincularla después. Una cuenta puede recibir accesos de varios espacios; solo sus relaciones autorizadas aparecen en el selector de Mi perfil.

### Explorar como cliente sin invitación

La acción **Explorar con datos de demostración** crea una firma y abogada ficticias, un cliente asociado a la cuenta, **3 expedientes**, documentos, etapas, compromisos, mensajes y notificaciones. El contexto está separado de los abogados registrados y se identifica visualmente como ficticio. Volver a pulsar la acción reutiliza el mismo contexto; no duplica datos. Si después acepta una invitación, puede alternar entre su contexto ficticio y sus relaciones autorizadas desde Mi perfil.

Las cuentas registradas no disponen de los controles para suplantar perfiles de la demostración rápida. Cada abogado permanece en su propio espacio. **Cerrar sesión** está disponible en la barra superior y en perfil/configuración. Las cuentas y los datos permanecen en este navegador para volver a ingresar.

### Contraseñas y sesiones locales

Las contraseñas de demostración se derivan con **PBKDF2-SHA256, 310.000 iteraciones, sal aleatoria de 32 bytes y verificador de 256 bits**, utilizando Web Crypto. Solo se conserva el verificador, nunca la contraseña ni su confirmación en texto plano. Se requiere localhost o HTTPS. La sesión simulada guarda identificadores de cuenta/perfil; no hay tokens de autenticación de servidor, correo verificado ni recuperación real de contraseña.

**Esto no constituye autenticación ni protección de producción:** quien controle el navegador puede inspeccionar y modificar el almacenamiento local. No use credenciales habituales ni información jurídica real. Las cuentas solo existen en el origen y perfil del navegador donde se registraron.

### Restablecer datos propios

- Abogado registrado: **Configuración → Restablecer datos de demostración**, con confirmación. Regenera únicamente su espacio, conservando su cuenta y los espacios de otros usuarios. Los accesos e invitaciones de ese espacio se eliminan; los clientes conservan sus cuentas y pueden recibir nuevas invitaciones.
- Cliente registrado: **Mi perfil → Restablecer mis datos de prueba** regenera únicamente su contexto ficticio, conservando las relaciones con otros abogados.
- Demostración rápida: el restablecimiento afecta únicamente a los dos espacios iniciales; conserva las cuentas registradas y sus espacios propios.

## Demostración rápida sin registro

Desde **Probar Legal Special One** (`/demo`), seleccionar espacio y perfil y pulsar **Entrar a la demostración**. Este modo no solicita contraseñas.

| Espacio ficticio | Perfil | Rol simulado |
| --- | --- | --- |
| Consultorio Jurídico Andino | Valentina Robles | Administrador |
| Consultorio Jurídico Andino | Tomás Beltrán | Abogado |
| Consultorio Jurídico Andino | Lucía Arce | Asistente jurídico |
| Estudio Jurídico Independiente | Emilia Montes | Abogado |

- Cambiar de organización desde la barra superior; en móvil, desde **Configuración**.
- Cambiar de perfil desde **Configuración → Probar otro perfil del espacio**.
- Salir desde **Configuración → Salir de la demo**.
- Como administrador demo, usar **Restablecer datos de demostración** para restaurar las semillas de los dos espacios iniciales.

Los tres roles consultan los datos operativos de su organización. Administradores y abogados pueden realizar operaciones jurídicas; el asistente puede apoyar la operación pero no eliminar registros. Solo el administrador gestiona miembros, modifica el espacio y restablece datos. Estas reglas se comprueban en la interfaz y el repositorio local y **no constituyen protección de producción**.

## Funcionalidades

### Clientes y prospectos

- Alta, ficha, edición y desactivación; conversión de prospecto a cliente activo.
- Personas naturales y jurídicas, identificación, representante condicionado, contacto, ciudad, dirección, etiquetas y notas.
- Validación de correo y duplicados de documento dentro de la organización.
- Búsqueda, filtros por estado, tipo y etiqueta, ordenación y paginación.
- Interacciones manuales editables, expedientes, documentos y compromisos vinculados.

### Expedientes

- Alta y edición de código, cliente, proceso, radicado manual, despacho, partes, abogado responsable, prioridad y estado.
- Búsqueda por datos del expediente, cliente y responsable; filtros y ordenación.
- Resumen, cronología de actuaciones manuales y enlaces entre módulos.
- Creación contextual de documentos y actividades.
- Conservación de relaciones: los asuntos con registros vinculados se archivan en lugar de eliminarse.

### Documentos

- Carga local de PDF, PNG, JPG, WebP, DOCX y TXT, con límite de **10 MB por archivo**.
- Categorías/carpetas lógicas, vínculos a cliente y expediente, nombre editable y filtros por formato/categoría/relación.
- Archivos binarios almacenados como blobs en IndexedDB; no se convierten a Base64 en localStorage.
- Nuevas versiones sin perder las anteriores; descarga de cada versión.
- Vista previa local de imágenes, PDF y texto, según compatibilidad del navegador. DOCX se descarga, sin prometer previsualización.
- Plantillas genéricas de memorial y contrato, editables y descargables como TXT, con indicación de revisión profesional.
- Cuatro documentos de muestra TXT con contenido real generado en el navegador y claramente ficticio.

### Agenda

- Lista y calendario mensual navegable; creación desde un día del calendario.
- Audiencias, reuniones, tareas, vencimientos y recordatorios, con responsable, prioridad, hora de Bogotá y vínculos.
- Edición, finalización, cancelación y eliminación con confirmación.
- Búsqueda y filtros por tipo, responsable, estado, prioridad y período.
- Recordatorios internos al entrar, para el usuario seleccionado; sin correos, SMS ni push.
- **Los términos y vencimientos deben ser verificados por el profesional responsable.** No se calculan términos judiciales.

### Funciones transversales

- Dashboard con indicadores derivados de los registros, agenda próxima, compromisos que requieren atención, expedientes por responsable, documentos recientes y actividad.
- Búsqueda global de clientes, expedientes y documentos con **Ctrl/Cmd + K**.
- Centro de notificaciones leídas/no leídas e historial de eventos locales.
- Perfiles, gestión de miembros y edición de organización según permisos simulados.
- Tema claro/oscuro persistente, menú contraíble en escritorio y navegación móvil con control de foco y Escape.
- Formularios con validación y confirmación al descartar cambios; diálogos accesibles basados en Radix.

### Portal del Cliente y comunicaciones

- Experiencia independiente con Inicio, Mis procesos, Mensajes, Documentos, Notificaciones y Mi perfil.
- **Clientes → ficha → Acceso al portal → Invitar al Portal**: nombre/correo ficticios del cliente o representante, selección explícita de expedientes y permisos de documentos, chat y compromisos. La invitación aparece localmente; no se envía correo ni se solicita contraseña.
- Varios representantes por cliente y varios usuarios por expediente. Revocación por expediente o de todo el portal, comprobada también por los comandos y descargas del repositorio.
- **Expedientes → ficha → Seguimiento para el cliente**: etapas reordenables, estados, explicaciones sencillas, documentos revisados, compromisos y relaciones con bifurcaciones/retornos. La cronología interna no se comparte automáticamente.
- **Guardar borrador** conserva el trabajo sin cambiar lo que ve el cliente. **Vista previa del cliente** muestra el contenido publicable con los permisos del destinatario. **Revisar y publicar** crea una nueva revisión, conserva el historial y notifica a los destinatarios autorizados.
- Seguimiento dinámico en palabras sencillas, línea de tiempo interactiva y diagrama SVG navegable con una alternativa textual de sus conexiones. No calcula probabilidades, porcentajes de avance o fechas de resolución.
- Archivos ligados a etapas y fijados a la **versión revisada al publicar**. Subir una versión posterior no la comparte automáticamente. Vista previa local para formatos compatibles y descarga autorizada.
- **Comunicaciones** permite al profesional contestar las conversaciones; cada conversación pertenece a un usuario autorizado y un expediente. El cliente puede adjuntar únicamente documentos ya publicados. Los indicadores de lectura cambian al pulsar «Marcar como leídos».
- Notificaciones locales por publicación, documentos compartidos, compromisos, cambios de estado publicados y mensajes. Una revocación oculta el asunto y sus mensajes, archivos y notificaciones.

#### Recorrido de prueba del portal

1. Abrir **Probar Legal Special One** (`/demo`) y entrar como **Valentina Robles** en **Consultorio Jurídico Andino**.
2. Abrir **Clientes → Isabela del Valle → Invitar al Portal**. Usar un nombre y correo ficticios nuevos para probar otro representante; seleccionar uno o varios expedientes y generar la invitación.
3. Abrir el expediente **LSO-001 → Gestionar seguimiento**. Editar una etapa, explicación o conexión, guardar el borrador y revisar la vista previa. Publicar la revisión cuando esté lista.
4. En el selector **Probar Portal del Cliente**, elegir el invitado y pulsar **Aceptar invitación y entrar**. También hay dos perfiles activos iniciales: **Isabela del Valle** y **Horizonte Creativo S.A.S.**
5. Abrir el asunto y explorar las tres vistas, los documentos y los compromisos publicados. Enviar un mensaje desde **Mensajes**.
6. Pulsar **Volver al profesional demo → Comunicaciones**, seleccionar la conversación y responder. Volver al perfil del cliente para comprobar la respuesta y las notificaciones.
7. Regresar a la ficha del cliente y revocar un expediente o todo el portal; volver a probar el perfil. Recargar conserva la selección y los cambios.

El selector de perfiles está disponible únicamente en la demostración rápida: acceso, barra superior de escritorio, Comunicaciones y Mi perfil del cliente. En móvil se puede entrar desde Comunicaciones. En las cuentas registradas, el inicio de sesión determina el perfil; las invitaciones se aceptan mediante su código.

## Persistencia y datos ficticios

La base IndexedDB se llama `legal-special-one`, versión 1. El almacén `state` contiene el estado profesional en `demo`, la extensión `portal-v1` y las cuentas/verificadores en `accounts-v1`. Las invitaciones se incorporan aditivamente a `portal-v1`. La migración conserva registros, blobs y publicaciones existentes. `localStorage` guarda solo `lso-identity`, `lso-session`, `lso-theme` y `lso-portal-user`: identificadores de sesión demo y preferencias, nunca contraseñas.

La primera apertura conserva las semillas idempotentes de la demostración rápida: **2 organizaciones, 4 miembros, 10 clientes, 10 expedientes, 16 actividades y 4 documentos**. Cada registro de abogado añade su conjunto independiente mediante `data/workspace-generator.ts`; cada cliente que activa su contexto añade el suyo. Las recargas no vuelven a generarlos ni sobrescriben modificaciones. Restablecer recalcula las fechas del espacio elegido.

Cada registro operativo lleva `organizationId`. Las consultas se filtran por el espacio y las escrituras validan que las relaciones pertenezcan a la misma organización. La selección de un expediente completa su cliente vinculado. Se impiden borrados que rompan relaciones.

Los datos pertenecen al **origen y perfil del navegador**: no se sincronizan entre equipos, sesiones privadas, puertos o dominios de despliegue. Borrar el almacenamiento del sitio elimina la demo. Si IndexedDB está bloqueado o no hay cuota, se informa explícitamente; una operación fallida no se presenta como guardada. IndexedDB debe estar disponible para trabajar.

## Arquitectura

```text
src/
  app/                 App Router, layout y estilos con tokens de marca
    [[...route]]/      Punto de entrada para rutas locales de módulos y fichas
  components/          Workspace, contexto, shell, formularios, diálogos y UI
  features/            Dashboard, CRM/expedientes/documentos, agenda y ajustes
  data/seed.ts         Semillas ficticias relacionadas e idempotentes
  lib/                 Repositorio IndexedDB, permisos, validación y fechas
  types/domain.ts      Tipos explícitos y relaciones del dominio
public/                Logo oficial, monograma e icono de pestaña derivados de referencias
tests/                 Reglas de negocio y repositorio con fake-indexeddb
e2e/                   Flujos reales de navegador con Playwright
```

**Stack:** Next.js 16 App Router, React 19, TypeScript estricto, Tailwind CSS 4, Radix Dialog, Lucide, Zod, `idb`, Manrope local, Vitest y Playwright.

La presentación accede a comandos de los contextos; `DemoRepository` y `PortalRepository` conservan los módulos profesionales y del portal. `AccountRepository` (`lib/account-repository.ts`) concentra registro, verificación local, aceptación de invitaciones, generación y restablecimiento de espacios en transacciones IndexedDB. `lib/passwords.ts` encapsula Web Crypto. `AccountProvider` separa cuentas registradas de la identidad rápida; `PortalProvider` conserva publicaciones y comunicación. Las instantáneas de las operaciones de cuenta actualizan ambos portales conjuntamente para evitar estados intermedios incoherentes. Los generadores están en `data/workspace-generator.ts` y `data/demo-invitations.ts`, fuera de React. No hay route handlers, backend de negocio ni llamadas judiciales o de IA.

Los formularios usan una definición homogénea de campos y Zod, junto con validaciones nativas del navegador. Se eligió esta alternativa ligera a React Hook Form para mantener un comportamiento común en todos los dominios.

## Validaciones

### Formato de código

El proyecto utiliza Prettier con indentación de 2 espacios, comillas simples y un ancho objetivo de 100 caracteres. La configuración se comparte mediante `.prettierrc.json`; `.prettierignore` excluye los archivos generados, recursos gráficos y documentación.

```bash
npm run format        # Aplicar formato al código
npm run format:check  # Verificar el formato sin modificar archivos
```

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pruebas de navegador:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright utiliza Chromium, inicia `npm start` cuando no existe un servidor en el puerto 3000 y reutiliza el servidor si ya está abierto. Para comprobar el build de producción en otro puerto: `PLAYWRIGHT_PORT=3100 npm run test:e2e`. Las pruebas usan contextos aislados y no modifican la demo del navegador personal. Capturas y trazas se guardan en `test-results/` (ignorado por Git).

La cobertura incluye reglas profesionales y del portal, además de flujos de navegador de CRUD, persistencia, publicación, versionado, autorización, chat bidireccional y revocación. Los recorridos visuales existentes comprueban escala tipográfica, contraste y desbordamientos en ambos temas; el portal añade capturas de escritorio y móvil oscuro. Véase [IMPLEMENTACION.md](./IMPLEMENTACION.md) para el resultado de las validaciones de esta entrega y [MEJORAS_UX.md](./MEJORAS_UX.md) para el refinamiento anterior.

## Desplegar en Vercel

1. Subir este proyecto a un repositorio Git propio.
2. En Vercel, **Add New → Project**, e importar ese repositorio.
3. Seleccionar la raíz que contiene `package.json` y el preset **Next.js**.
4. Usar Node.js **24.x** (o 22.x compatible), instalación `npm ci` y compilación `npm run build`.
5. Conservar el directorio de salida detectado automáticamente por Next.js.
6. Desplegar. **No se necesitan variables secretas ni servicios adicionales.**

No se ha publicado un despliegue desde esta entrega. Cada visitante del despliegue tendrá sus propios datos locales. Cambiar de URL de preview a producción crea otro origen de almacenamiento.

## Alcance y siguiente fase

Consulte [IMPLEMENTACION.md](./IMPLEMENTACION.md) para decisiones, correspondencia de referencias, verificación y límites concretos. Esta demo no ofrece autenticación, seguridad documental de producción, copia de respaldo remota, colaboración simultánea ni aislamiento real entre organizaciones.

Una segunda fase requeriría autenticación real, autorización en servidor, almacenamiento privado, auditoría confiable, copias y restauración, disponibilidad y revisión del tratamiento de datos conforme a la normativa colombiana, incluida la Ley 1581 de 2012. Esas capacidades no se simulan como implementadas.

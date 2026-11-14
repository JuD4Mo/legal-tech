# LEGAL SPECIAL ONE

**La gestión jurídica, en un solo lugar.**

Demostración funcional de una plataforma de gestión jurídica para abogados independientes y firmas en Colombia. Incluye CRM, expedientes, repositorio documental y agenda conectados por datos locales, con identidad azul noche y dorado.

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

## Acceder a la demo

En la bienvenida, seleccionar espacio y perfil y pulsar **Entrar a la demostración**. No se solicitan contraseñas.

| Espacio ficticio | Perfil | Rol simulado |
| --- | --- | --- |
| Consultorio Jurídico Andino | Valentina Robles | Administrador |
| Consultorio Jurídico Andino | Tomás Beltrán | Abogado |
| Consultorio Jurídico Andino | Lucía Arce | Asistente jurídico |
| Estudio Jurídico Independiente | Emilia Montes | Abogado |

- Cambiar de organización desde la barra superior; en móvil, desde **Configuración**.
- Cambiar de perfil desde **Configuración → Probar otro perfil del espacio**.
- Salir desde **Configuración → Salir de la demo**.
- Como administrador, usar **Restablecer datos de demostración** para borrar todos los registros y archivos locales de ambos espacios y restaurar las semillas.

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

## Persistencia y datos ficticios

La base IndexedDB se llama `legal-special-one`, versión 1. Contiene el estado de la demo, incluidos los blobs de todas las versiones documentales. `localStorage` almacena únicamente `lso-session` y `lso-theme`.

La primera apertura carga semillas idempotentes: **2 organizaciones, 4 miembros, 10 clientes, 10 expedientes, 16 actividades y 4 documentos**, con interacciones y bitácora. Las fechas se calculan relativamente al día de inicialización en Bogotá; las recargas posteriores conservan los datos. Restablecer vuelve a calcular las fechas.

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

La presentación accede a comandos del contexto; el adaptador de datos está concentrado en `lib/repository.ts`. `DemoRepository` define carga, guardado, eliminación y restablecimiento; la carga de archivos y recordatorios son operaciones locales complementarias. Una fase futura puede sustituir ese adaptador por servicios con controles reales en servidor. No hay route handlers, backend de negocio, autenticación o llamadas a servicios judiciales.

Los formularios usan una definición homogénea de campos y Zod, junto con validaciones nativas del navegador. Se eligió esta alternativa ligera a React Hook Form para mantener un comportamiento común en todos los dominios.

## Validaciones

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

Playwright utiliza Chromium, inicia `npm start` cuando no existe un servidor en el puerto 3000 y reutiliza el servidor si ya está abierto. Las pruebas utilizan contextos aislados y no modifican la demo del navegador personal. Las capturas de escritorio y móvil y las trazas ante fallos se guardan en `test-results/` (ignorado por Git).

Cobertura actual: 11 pruebas de dominio/repositorio y 10 pruebas de navegador: 4 flujos integrales de CRUD, persistencia, versionado, relaciones y permisos; 2 pruebas de arranque y alineación de la marca durante la carga; y 4 recorridos de revisión visual en 1440 × 900, 1920 × 1080, 1024 × 768 y 390 × 844. Estos últimos comprueban escala tipográfica, contraste y desbordamientos en los dos temas. Véase [MEJORAS_UX.md](./MEJORAS_UX.md) para el refinamiento visual realizado.

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

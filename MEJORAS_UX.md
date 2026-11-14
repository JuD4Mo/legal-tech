# Refinamiento UX/UI

## Diagnóstico

La composición anterior separaba saludo, contexto y un banner promocional de gran altura antes de mostrar el trabajo pendiente. La escala de 7–11 px en navegación, metadatos, tablas y controles producía una falsa sensación de espacio y debilitaba la jerarquía. Las mismas tarjetas, badges, puntos y flechas se repetían en contenidos de distinta naturaleza.

## Cambios realizados

- **Sistema visual compartido:** se reorganizó `globals.css` en reglas legibles por componente y breakpoints, con tokens comunes de espaciado, superficies, bordes, radios y estados semánticos para ambos temas. Se eliminaron gradientes, fondos decorativos y sombras de las superficies de trabajo.
- **Tipografía:** cuerpo, navegación, formularios y botones de 14 px; texto secundario de 13 px; metadatos de 12 px; encabezados de sección de 16–17 px; títulos de página de 26–28 px; indicadores de 30–32 px. Ningún texto visible de la aplicación se define por debajo de 12 px.
- **Contraste:** se mantienen los cinco colores oficiales. Para el texto secundario sobre blanco cálido se usa el derivado `#5D697A`: el gris original `#697586` sobre `#F7F8FA` daba aproximadamente 4.40:1. Los badges tienen pares de texto/fondo propios para cada tema. No se usan textos dorados pequeños sobre blanco.
- **Encabezados:** el dashboard reúne saludo, fecha y acción principal en un encabezado azul institucional de 112 px en escritorio. Desaparecieron el mensaje promocional y la marca de agua. El resto de módulos utiliza títulos sobre el fondo de trabajo, sin banners repetidos.
- **Indicadores:** tarjetas compactas con etiqueta, número sin relleno y dato complementario real. Se eliminaron iconos redundantes, flechas y separadores internos. La tarjeta completa sigue siendo un enlace.
- **Acciones:** botones de ancho natural para cliente, actividad y documento; crear expediente permanece como acción principal, sin duplicarla en otra fila.
- **Agenda:** nuevo componente compartido `TaskRow`, utilizado en el módulo y el dashboard. Muestra fecha, hora, título, expediente y acciones; el estado y la prioridad se presentan según el contexto, sin una acumulación de badges. Se puede completar una actividad directamente desde el resumen. Los vencimientos se ordenan por fecha y los atrasados se priorizan en móvil.
- **Información secundaria:** los expedientes por responsable usan una tabla de abiertos/total en lugar de barras decorativas. Los documentos son una lista y la actividad reciente un registro con columnas, sin otra tarjeta contenedora.
- **Navegación:** texto legible, contexto de organización más directo y aviso de demo reducido a un enlace funcional. Se añadieron nombre accesible de la navegación y `aria-current` para la sección activa.
- **Listas y fichas:** controles de búsqueda y filtros de 14 px, texto de tablas de 14 px, relaciones con separadores y metadatos legibles. Se mantiene la presentación en lista de las tablas en móvil.
- **Formularios y modales:** etiquetas de 14 px, controles consistentes, título sin la marca repetida y acciones accesibles durante el desplazamiento. Se conserva el manejo de foco de Radix y la confirmación de cambios sin guardar.
- **Responsive:** escritorio con ancho de lectura limitado, navegación compacta en tablet y drawer en móvil. El calendario conserva texto legible mediante desplazamiento horizontal interno, sin desbordar la página.

## Verificación

`e2e/ui-review.spec.ts` recorre acceso, los ocho módulos, fichas de cliente/expediente/documento, formulario, notificaciones y calendario en **1440 × 900**, **1920 × 1080**, **1024 × 768** y **390 × 844**, tanto en modo claro como oscuro.

La comprobación examina el tamaño y contraste del texto renderizado contra su superficie efectiva, así como el desbordamiento horizontal y la altura del encabezado. Comprueba al menos 4.5:1 para texto normal y 3:1 para texto grande. No equivale a una certificación completa de accesibilidad: no evalúa todas las tecnologías de asistencia ni todos los estados interactivos posibles.

Las capturas de dashboard, clientes y formulario se generan en `test-results/ui-review-*/`. Las cuatro pruebas integrales existentes siguen comprobando CRUD, persistencia, archivos/versionado, relaciones, permisos, búsqueda y actualización de indicadores. Se actualizaron sus selectores de presentación y se espera la navegación de entrada antes de interactuar.

El repositorio local, las semillas, las reglas de permisos, la validación de dominio y las dependencias se conservaron. No se añadieron servicios ni dependencias.

### Comandos

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

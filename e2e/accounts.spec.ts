import { test, expect, type Page } from '@playwright/test';
const password = 'ClaveFicticia-2026';
async function fillRegistration(page: Page, firstName: string, email: string) {
  await page.getByLabel('Nombres', { exact: true }).fill(firstName);
  await page.getByLabel('Apellidos', { exact: true }).fill('Prueba');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña de demostración', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(password);
}
async function login(page: Page, email: string) {
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña de demostración', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await page.waitForURL(email.startsWith('abogada') ? '**/dashboard' : '**/portal');
}
test('cuentas registradas: CRM, publicación, invitación por código y chat entre ambos perfiles', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('/');
  await page.getByRole('link', { name: 'Registrarme como abogado', exact: true }).click();
  await fillRegistration(page, 'Daniela', 'abogada@ejemplo.invalid');
  await page.getByLabel('Tipo de ejercicio profesional').selectOption('firma');
  await page.getByLabel('Nombre de la firma o espacio profesional').fill('Firma Prueba Registrada');
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Hola, Daniela.' })).toBeVisible();
  await expect(page.getByLabel('Cambiar espacio de trabajo')).toHaveCount(0);
  await expect(page.getByLabel('Ingresar como cliente demo')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
  await page.getByLabel('Nombre o razón social').fill('Cliente Vinculado Registrado');
  await page.getByLabel('Número de documento').fill('DEMO-REG-001');
  await page.getByLabel('Correo electrónico').fill('cliente-vinculado@ejemplo.invalid');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/clientes');
  await page.getByRole('link', { name: 'Ver Cliente Vinculado Registrado', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cliente Vinculado Registrado', exact: true }),
  ).toBeVisible();
  const clientUrl = page.url();
  await page.getByRole('button', { name: 'Crear expediente', exact: true }).click();
  await page.getByLabel('Título del expediente').fill('Asunto Vinculado Registrado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('link', { name: /Asunto Vinculado Registrado/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Asunto Vinculado Registrado', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Subir documento', exact: true }).click();
  await page.getByLabel('Nombre del documento').fill('Documento compartido de prueba');
  await page.locator('input[type=file]').setInputFiles({
    name: 'ejemplo.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('DOCUMENTO FICTICIO DE PRUEBA'),
  });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Gestionar seguimiento' }).click();
  await page.getByRole('button', { name: 'Crear etapa' }).click();
  await page.getByLabel('Título de la etapa').fill('Revisión jurídica de prueba');
  await page
    .getByRole('textbox', { name: 'Descripción para el cliente', exact: true })
    .fill('Su abogado está revisando los antecedentes del asunto ficticio.');
  await page.getByLabel('Estado de la etapa').selectOption('actual');
  await page
    .getByRole('textbox', { name: '¿Qué significa?', exact: true })
    .fill('Explicación aprobada por la abogada registrada.');
  await page.getByRole('checkbox', { name: /Documento compartido de prueba/ }).check();
  await page.getByRole('button', { name: 'Revisar y publicar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto(clientUrl);
  await page.getByRole('button', { name: 'Invitar al Portal', exact: true }).click();
  await page.getByRole('checkbox', { name: /Asunto Vinculado Registrado/ }).check();
  await page.getByRole('button', { name: 'Generar invitación local' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const code = await page
    .getByLabel('Código de invitación para cliente-vinculado@ejemplo.invalid', { exact: true })
    .inputValue();
  expect(code).toMatch(/^LSO-/);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/');
  await page.getByRole('link', { name: 'Registrarme como cliente', exact: true }).click();
  await fillRegistration(page, 'Elena', 'cliente-vinculado@ejemplo.invalid');
  await page.getByLabel('Código de invitación (opcional)').fill(code);
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await page.waitForURL('**/portal');
  await expect(page.getByRole('heading', { name: 'Hola, Elena.' })).toBeVisible();
  await expect(page.locator('.client-case-card')).toHaveCount(1);
  await page.getByRole('button', { name: /Asunto Vinculado Registrado/ }).click();
  await expect(
    page.getByText('Explicación aprobada por la abogada registrada.', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('tabpanel')
      .getByRole('button', { name: /Descargar Documento compartido de prueba/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Mensajes/ }).click();
  await page
    .getByLabel('Mensaje', { exact: true })
    .fill('Consulta desde una cuenta de cliente vinculada');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(
    page
      .getByRole('log')
      .getByText('Consulta desde una cuenta de cliente vinculada', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Elena.' })).toBeVisible();
  await page.goto('/expedientes/e0');
  await page.waitForURL('**/portal');
  await expect(page.getByRole('link', { name: 'Clientes', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login(page, 'abogada@ejemplo.invalid');
  await page.goto('/comunicaciones');
  await page
    .locator('.conversation-list')
    .getByRole('button', { name: /Elena Prueba/ })
    .click();
  await expect(
    page
      .getByRole('log')
      .getByText('Consulta desde una cuenta de cliente vinculada', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Mensaje', { exact: true }).fill('Respuesta desde la cuenta profesional');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(
    page.getByRole('log').getByText('Respuesta desde la cuenta profesional', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login(page, 'cliente-vinculado@ejemplo.invalid');
  await page.getByRole('button', { name: /^Mensajes/ }).click();
  await expect(
    page.getByRole('log').getByText('Respuesta desde la cuenta profesional', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('registered-client-conversation.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('cliente sin invitación, sandbox idempotente, perfil persistente y restablecimiento propio', async ({
  page,
}, testInfo) => {
  page.on('dialog', (d) => d.accept());
  await page.goto('/registro/cliente');
  await fillRegistration(page, 'Camila', 'sin-invitacion@ejemplo.invalid');
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await page.waitForURL('**/portal');
  await expect(
    page.getByText('Todavía no tiene expedientes asociados.', { exact: false }),
  ).toBeVisible();
  await page.getByLabel('Vincular invitación de mi abogado').fill('e0');
  await page.getByRole('button', { name: 'Vincular invitación', exact: true }).click();
  await expect(
    page.getByText('El código no existe, venció o fue revocado.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explorar con datos de demostración' }).click();
  await expect(page.locator('.client-case-card')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.client-case-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir mi contexto de demostración' }).click();
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.locator('.client-case-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Restablecer mis datos de prueba' }).click();
  await expect(
    page.getByText('Datos de su contexto ficticio restablecidos.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.locator('.client-case-card')).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('client-sandbox-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.goto('/registro/cliente');
  await fillRegistration(page, 'Otra', 'otra-cuenta@ejemplo.invalid');
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await expect(
    page.getByText('Todavía no tiene expedientes asociados.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.client-case-card')).toHaveCount(0);
});

test('página pública y formularios legibles en escritorio, tablet y móvil', async ({
  page,
}, testInfo) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/registro/abogado', '/registro/cliente', '/ingresar']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const smallest = await page
        .locator('main p,main label,main input,main button')
        .evaluateAll((nodes) =>
          Math.min(...nodes.map((node) => parseFloat(getComputedStyle(node).fontSize))),
        );
      expect(smallest).toBeGreaterThanOrEqual(14);
      if (path === '/' || path === '/registro/abogado')
        await page.screenshot({
          path: testInfo.outputPath(
            `${width}-${path === '/' ? 'public' : 'lawyer-registration'}.png`,
          ),
          fullPage: true,
        });
    }
  }
});

test('un cliente registrado sin expedientes puede vincular una invitación posteriormente', async ({
  page,
}) => {
  await page.goto('/registro/cliente');
  await fillRegistration(page, 'Natalia', 'vinculo-posterior@ejemplo.invalid');
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await expect(
    page.getByText('Todavía no tiene expedientes asociados.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/');
  await page.goto('/registro/abogado');
  await fillRegistration(page, 'Luciana', 'abogada-posterior@ejemplo.invalid');
  await page.getByRole('button', { name: 'Crear cuenta de demostración' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/clientes');
  await page.locator('tbody .entity-name').first().click();
  await expect(page.getByRole('heading', { name: 'Acceso al portal', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Invitar al Portal', exact: true }).click();
  await page.getByLabel('Nombre del cliente o representante').fill('Natalia Prueba');
  await page.getByLabel('Correo de demostración').fill('vinculo-posterior@ejemplo.invalid');
  await page
    .getByRole('group', { name: 'Expedientes autorizados' })
    .getByRole('checkbox')
    .first()
    .check();
  await page.getByRole('button', { name: 'Generar invitación local' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const code = await page
    .getByLabel('Código de invitación para vinculo-posterior@ejemplo.invalid', { exact: true })
    .inputValue();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/');
  await login(page, 'vinculo-posterior@ejemplo.invalid');
  await page.getByLabel('Vincular invitación de mi abogado').fill(code);
  await page.getByRole('button', { name: 'Vincular invitación', exact: true }).click();
  await expect(page.locator('.client-case-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.client-case-card')).toHaveCount(1);
});

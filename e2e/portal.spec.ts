import { test, expect } from '@playwright/test';

test('portal completo: invitación, publicación, documentos, chat y revocación', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Entrar a la demostración' }).click();
  await page.goto('/clientes/c0');
  await page.getByRole('button', { name: 'Invitar al Portal', exact: true }).click();
  await page.getByLabel('Nombre del cliente o representante').fill('Representante Portal Prueba');
  await page.getByLabel('Correo de demostración').fill('portal-prueba@ejemplo.invalid');
  await page.getByRole('checkbox', { name: /Restitución de inmueble arrendado/ }).check();
  await page.getByRole('button', { name: 'Generar invitación local' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/expedientes/e0');
  await page.getByRole('button', { name: 'Gestionar seguimiento' }).click();
  await page.getByRole('button', { name: /2\. Preparación de audiencia/ }).click();
  await page.getByLabel('Título de la etapa').fill('Preparación revisada para cliente');
  await page
    .getByRole('textbox', { name: '¿Qué significa?', exact: true })
    .fill('Explicación revisada por el abogado de prueba.');
  await page.getByLabel('Resumen de la actualización').fill('Publicación de prueba aprobada');
  await page.getByRole('button', { name: 'Vista previa del cliente' }).click();
  await expect(page.getByRole('heading', { name: 'Entiende tu proceso' })).toBeVisible();
  await expect(
    page
      .getByRole('tabpanel')
      .getByText('Explicación revisada por el abogado de prueba.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(page.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();
  await page.getByRole('button', { name: 'Revisar y publicar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByLabel('Ingresar como cliente demo')
    .selectOption({ label: 'Representante Portal Prueba · invitado' });
  await page.getByRole('button', { name: 'Aceptar invitación y entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Representante.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clientes', exact: true })).toHaveCount(0);
  await expect(page.getByText('Revisión de contrato comercial', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /LSO-001/ }).click();
  await expect(page.getByText('Publicación de prueba aprobada', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Explicación revisada por el abogado de prueba.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Línea de tiempo' }).click();
  await expect(page.locator('.portal-timeline li')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Diagrama de flujo' }).click();
  await expect(page.locator('.process-diagram')).toBeVisible();
  await expect(page.locator('.process-diagram foreignObject button')).toHaveCount(4);
  await expect(
    page
      .locator('.process-diagram')
      .getByRole('button', { name: 'Preparación revisada para cliente actual' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Descargar Contrato de ejemplo.txt/ }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar Contrato de ejemplo.txt/ }).click();
  expect((await download).suggestedFilename()).toBe('Contrato de ejemplo.txt');
  await page.getByRole('button', { name: /^Mensajes/ }).click();
  await page.getByLabel('Mensaje', { exact: true }).fill('Consulta bidireccional de prueba');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(
    page.getByRole('log').getByText('Consulta bidireccional de prueba', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Representante.' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al profesional demo' }).click();
  await page.goto('/comunicaciones');
  await page
    .locator('.conversation-list')
    .getByRole('button', { name: /Representante Portal Prueba/ })
    .click();
  await expect(
    page.getByRole('log').getByText('Consulta bidireccional de prueba', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Marcar .* como leídos/ }).click();
  await page.getByLabel('Mensaje', { exact: true }).fill('Respuesta profesional de prueba');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(
    page.getByRole('log').getByText('Respuesta profesional de prueba', { exact: true }),
  ).toBeVisible();
  await page
    .locator('.topbar')
    .getByLabel('Ingresar como cliente demo')
    .selectOption({ label: 'Representante Portal Prueba · activo' });
  await page.getByRole('button', { name: /^Mensajes/ }).click();
  await expect(page.getByText('Respuesta profesional de prueba', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await expect(page.getByText('Nuevo mensaje', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al profesional demo' }).click();
  await page.goto('/clientes/c0');
  const user = page
    .locator('.portal-access-user')
    .filter({ hasText: 'Representante Portal Prueba' });
  await user.getByRole('button', { name: 'Revocar expediente' }).click();
  await expect(user.getByText('Revocado', { exact: false })).toBeVisible();
  await user.getByRole('button', { name: 'Probar este perfil' }).click();
  await expect(
    page.getByText('No tiene expedientes autorizados actualmente.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Mensajes/ }).click();
  await expect(page.getByText('Respuesta profesional de prueba', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Volver al profesional demo' }).click();
  await user.getByRole('button', { name: 'Revocar portal' }).click();
  await user.getByRole('button', { name: 'Probar este perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Acceso no disponible' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('portal-revoked.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('portal cliente responsive, tema, persistencia y estados sin publicar', async ({
  page,
}, testInfo) => {
  await page.goto('/demo');
  await page
    .getByLabel('Ingresar como cliente demo')
    .selectOption({ label: 'Isabela del Valle · activo' });
  await expect(page.getByRole('heading', { name: 'Hola, Isabela.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('portal-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cambiar tema' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Hola, Isabela.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: /LSO-001/ }).click();
  await page.getByRole('tab', { name: 'Diagrama de flujo' }).click();
  await expect(page.locator('.process-diagram')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('portal-mobile-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'Mi perfil', exact: true }).click();
  await page
    .getByLabel('Ingresar como cliente demo')
    .selectOption({ label: 'Horizonte Creativo S.A.S. · activo' });
  await expect(page.getByRole('heading', { name: 'Hola, Horizonte.' })).toBeVisible();
  await expect(page.getByText('Restitución de inmueble arrendado', { exact: true })).toHaveCount(0);
});

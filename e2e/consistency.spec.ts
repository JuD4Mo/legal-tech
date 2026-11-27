import { test, expect } from '@playwright/test';

test('los indicadores responden a crear y completar tareas; filtros consultan datos reales', async ({
  page,
}) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Entrar a la demostración' }).click();
  await page.waitForURL('**/dashboard');
  const pendingCard = page.locator('.stat-card').filter({ hasText: 'Actividades pendientes' });
  const initialCount = Number(await pendingCard.locator('.stat-value').innerText());

  await page.getByRole('button', { name: 'Nueva actividad', exact: true }).click();
  await page.getByLabel('Título de la actividad').fill('Tarea para comprobar indicadores');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(pendingCard.locator('.stat-value')).toHaveText(String(initialCount + 1));

  await page.goto('/agenda');
  await page
    .getByRole('textbox', { name: 'Buscar actividad' })
    .fill('Tarea para comprobar indicadores');
  await expect(page.locator('.agenda-list .task-row')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Completar Tarea para comprobar indicadores', exact: true })
    .click();
  await expect(page.locator('.agenda-list .task-row')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Estado de actividad' }).selectOption('completada');
  await expect(page.locator('.agenda-list .task-row')).toHaveCount(1);
  await page.goto('/dashboard');
  await expect(pendingCard.locator('.stat-value')).toHaveText(String(initialCount));

  await page.goto('/clientes');
  await page.getByRole('combobox', { name: 'Todos los estados' }).selectOption('prospecto');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Buscar registros' }).fill('No existe este cliente');
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'No encontramos registros con estos filtros' }),
  ).toBeVisible();
});

test('archivos de imagen: vínculos, formato, previsualización local y descarga', async ({
  page,
}) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Entrar a la demostración' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/documentos');
  await page.getByRole('button', { name: 'Subir documento', exact: true }).click();
  await page.getByLabel('Nombre del documento').fill('Imagen ficticia de prueba');
  await page.getByLabel('Categoría / carpeta').selectOption('pruebas');
  await page.getByLabel('Expediente asociado').selectOption('e0');
  await expect(page.getByLabel('Cliente asociado')).toHaveValue('c0');
  await page.locator('input[type=file]').setInputFiles({
    name: 'imagen.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/YQAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('combobox', { name: 'Formato' }).selectOption('image/png');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: 'Ver Imagen ficticia de prueba', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Isabela del Valle', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previsualizar versión 1', exact: true }).click();
  await expect(page.getByRole('img', { name: 'imagen.png' })).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: 'imagen.png' })
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(1);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar versión 1', exact: true }).click();
  expect((await downloading).suggestedFilename()).toBe('imagen.png');
});

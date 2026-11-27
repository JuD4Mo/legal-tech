import { test, expect } from '@playwright/test';

test('la ruta principal presenta el producto y ambos registros', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Registrarme como abogado' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Registrarme como cliente' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('la marca está centrada con el indicador durante la carga', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 467, height: 600 });
  // Hold the native storage response to inspect the same loading state as the screenshot.
  await page.addInitScript(() => {
    const original = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, version) {
      const request =
        version === undefined ? original.call(this, name) : original.call(this, name, version);
      request.addEventListener('success', (event) => event.stopImmediatePropagation());
      return request;
    };
  });
  await page.goto('/demo');
  await expect(page.getByText('Preparando su espacio jurídico…')).toBeVisible();
  await expect(page.locator('.brand-symbol')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('carga.png') });
  const symbol = await page.locator('.brand-symbol').boundingBox();
  const text = await page.locator('.brand-text').boundingBox();
  const loader = await page.locator('.loader').boundingBox();
  const brandCenter = (symbol!.x + text!.x + text!.width) / 2;
  expect(Math.abs(brandCenter - (loader!.x + loader!.width / 2))).toBeLessThanOrEqual(2);
});

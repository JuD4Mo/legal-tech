import { test, expect, type Page } from '@playwright/test';

// Checks actual rendered text, including inherited colours and surface backgrounds.
async function inspectTypography(page: Page) {
  return page.evaluate(() => {
    const issues: string[] = [];
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
    const luminance = (channels: number[]) => {
      const linear = channels.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const background = (element: Element): number[] => {
      const own = rgb(getComputedStyle(element).backgroundColor);
      if ((own[3] ?? 1) === 1) return own;
      const behind = element.parentElement ? background(element.parentElement) : [255, 255, 255];
      const alpha = own[3] ?? 0;
      return [0, 1, 2].map((index) => (own[index] ?? 0) * alpha + behind[index] * (1 - alpha));
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      const element = walker.currentNode.parentElement;
      if (
        !text ||
        !element ||
        element.closest('script, style, svg, .sr-only, [aria-hidden="true"], [disabled]')
      )
        continue;
      const style = getComputedStyle(element);
      if (
        !element.getClientRects().length ||
        style.visibility !== 'visible' ||
        Number(style.opacity) === 0
      )
        continue;
      const size = parseFloat(style.fontSize);
      if (size < 12) issues.push(`Tamaño ${size}px: ${text.slice(0, 60)}`);
      const foreground = rgb(style.color);
      if (foreground.length < 3) continue;
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background(element));
      const ratio =
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
      const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5))
        issues.push(`Contraste ${ratio.toFixed(2)}: ${text.slice(0, 60)} (${style.color})`);
    }
    return [...new Set(issues)];
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`revisión visual y legibilidad ${viewport.width} × ${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar a la demostración' })).toBeVisible();
    expect(await inspectTypography(page), 'Acceso').toEqual([]);
    await page.getByRole('button', { name: 'Entrar a la demostración' }).click();
    await page.waitForURL('**/dashboard');

    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Cambiar tema' }).click();
      for (const route of [
        'dashboard',
        'clientes',
        'expedientes',
        'documentos',
        'agenda',
        'equipo',
        'actividad',
        'configuracion',
        'clientes/c0',
        'expedientes/e0',
        'documentos/d0',
      ]) {
        await page.goto(`/${route}`);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${theme}/${route}: desbordamiento`,
        ).toBe(true);
        expect(await inspectTypography(page), `${theme}/${route}: escala y contraste`).toEqual([]);
        if (route === 'dashboard') {
          await page.screenshot({
            path: testInfo.outputPath(`dashboard-${theme}.png`),
            fullPage: true,
          });
          const header = await page.locator('.overview-banner').boundingBox();
          expect(header!.height).toBeLessThan(viewport.width > 700 ? 141 : 220);
        }
        if (route === 'clientes')
          await page.screenshot({
            path: testInfo.outputPath(`clientes-${theme}.png`),
            fullPage: true,
          });
      }
      await page.goto('/clientes');
      await page.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await inspectTypography(page), `${theme}/formulario`).toEqual([]);
      expect(
        await page
          .getByLabel('Nombre o razón social')
          .evaluate((input) => getComputedStyle(input).fontSize),
      ).toBe('14px');
      await page.screenshot({ path: testInfo.outputPath(`formulario-${theme}.png`) });
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.getByRole('button', { name: /Notificaciones,/ }).click();
      expect(await inspectTypography(page), `${theme}/notificaciones`).toEqual([]);
      await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
      await page.goto('/agenda');
      await page.getByRole('button', { name: 'Calendario', exact: true }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme}/calendario`,
      ).toBe(true);
      expect(await inspectTypography(page), `${theme}/calendario`).toEqual([]);
    }
  });
}

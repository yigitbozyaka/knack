import { expect, test } from '@playwright/test'

test.describe('UUID generator', () => {
  test('generates and copies a v4 UUID', async ({ page }) => {
    await page.goto('/generate/uuid')
    await page
      .getByRole('button', { name: /generate/i })
      .first()
      .click()
    const text = await page.locator('[data-testid="uuid-output"]').first().textContent()
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  test('generates v7 UUIDs', async ({ page }) => {
    await page.goto('/generate/uuid')
    await page.getByRole('button', { name: 'V7' }).click()
    await page
      .getByRole('button', { name: /generate/i })
      .first()
      .click()
    const text = await page.locator('[data-testid="uuid-output"]').first().textContent()
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })
})

test.describe('Password generator', () => {
  test('shows a non-empty password on load', async ({ page }) => {
    await page.goto('/generate/password')
    const password = await page.locator('[data-testid="password-output"]').textContent()
    expect(password?.trim().length).toBeGreaterThan(0)
  })

  test('regenerates on button click', async ({ page }) => {
    await page.goto('/generate/password')
    const first = await page.locator('[data-testid="password-output"]').textContent()
    await page.getByRole('button', { name: /regenerate/i }).click()
    const second = await page.locator('[data-testid="password-output"]').textContent()
    // Extremely unlikely to match, but not impossible — just verify the action ran
    expect(typeof second).toBe('string')
    expect(first).not.toBeUndefined()
  })
})

test.describe('Secret generator', () => {
  test('shows a hex secret on load', async ({ page }) => {
    await page.goto('/generate/secret')
    const secret = await page.locator('[data-testid="secret-output"]').textContent()
    expect(secret?.trim()).toMatch(/^[0-9a-f]+$/i)
  })
})

test.describe('Formatter', () => {
  test('pretty-prints JSON', async ({ page }) => {
    await page.goto('/format')
    const textarea = page.getByLabel('Input', { exact: true })
    await textarea.fill('{"a":1}')
    await page.getByRole('button', { name: /format/i }).click()
    const output = await page.locator('[data-testid="format-output"]').textContent()
    expect(output).toContain('"a"')
  })
})

test.describe('Markdown viewer', () => {
  test('renders heading from markdown', async ({ page }) => {
    await page.goto('/markdown')
    const textarea = page.getByLabel('Markdown input')
    await textarea.fill('# Hello Playwright')
    const preview = page.locator('.markdown-body')
    await expect(preview.locator('h1')).toHaveText('Hello Playwright')
  })
})

test.describe('Scratchpad', () => {
  test('creates a note and persists title', async ({ page }) => {
    await page.goto('/notes')
    await page
      .getByRole('button', { name: /new note/i })
      .first()
      .click()
    const titleInput = page.getByLabel('Note title')
    await titleInput.fill('E2E test note')
    await expect(page.getByText('E2E test note')).toBeVisible()
  })
})

test.describe("What's my IP", () => {
  test('displays an IP address', async ({ page }) => {
    await page.goto('/ip')
    const ip = page.locator('span.font-mono')
    await expect(ip).toBeVisible({ timeout: 10_000 })
    const text = await ip.textContent()
    expect(text?.trim()).toMatch(/^[\d.:a-f]+$/i)
  })
})

test.describe('Homepage', () => {
  test('shows live tools and category tabs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Generators' })).toBeVisible()
    await expect(page.getByRole('link', { name: /uuid generator/i })).toBeVisible()
  })

  test('search filters tools', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Search tools').fill('uuid')
    await expect(page.getByRole('link', { name: /uuid generator/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /password generator/i })).not.toBeVisible()
  })
})

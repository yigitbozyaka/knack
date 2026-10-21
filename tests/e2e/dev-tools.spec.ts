import { expect, test } from '@playwright/test'

test.describe('Regex tester', () => {
  test('highlights matches and lists capture groups', async ({ page }) => {
    await page.goto('/regex')
    await page.getByLabel('Pattern').fill('(\\d+)-(\\d+)')
    await page.getByLabel('Test string').fill('call 555-1234 or 800-9999')
    await expect(page.getByTestId('regex-count')).toHaveText('2 matches')
    await expect(page.getByTestId('regex-mark')).toHaveCount(2)
    await expect(page.getByTestId('regex-row')).toHaveCount(2)
    await expect(page.getByTestId('regex-row').first()).toContainText('555-1234')
    await expect(page.getByTestId('regex-row').first()).toContainText('1: 555')
  })

  test('shows an error for an invalid pattern', async ({ page }) => {
    await page.goto('/regex')
    await page.getByLabel('Pattern').fill('(')
    await expect(page.getByTestId('regex-error')).toBeVisible()
  })

  test('caps the number of rendered matches', async ({ page }) => {
    await page.goto('/regex')
    await page.getByLabel('Pattern').fill('a')
    await page.getByLabel('Test string').fill('a'.repeat(1500))
    await expect(page.getByTestId('regex-count')).toHaveText('1000+ matches')
    await expect(page.getByTestId('regex-row')).toHaveCount(1000)
  })
})

test.describe('Text diff', () => {
  test('shows added and removed lines', async ({ page }) => {
    await page.goto('/diff')
    await page.getByLabel('Original').fill('one\ntwo\nthree')
    await page.getByLabel('Modified').fill('one\n2\nthree\nfour')
    await expect(page.getByTestId('diff-stats')).toContainText('+2')
    await expect(page.locator('[data-testid="diff-row"][data-kind="add"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="diff-row"][data-kind="remove"]')).toHaveCount(1)
  })

  test('switches to side by side and word mode', async ({ page }) => {
    await page.goto('/diff')
    await page.getByLabel('Original').fill('the quick fox')
    await page.getByLabel('Modified').fill('the slow fox')
    await page.getByRole('button', { name: 'Side by side' }).click()
    await expect(page.getByTestId('diff-output')).toContainText('quick')
    await expect(page.getByTestId('diff-output')).toContainText('slow')
    await page.getByRole('button', { name: 'Word', exact: true }).click()
    await expect(page.getByTestId('diff-stats')).toContainText('+1 −1')
  })
})

test.describe('Timestamp converter', () => {
  test('converts a Unix timestamp', async ({ page }) => {
    await page.goto('/timestamp')
    await page.getByLabel('Timestamp or date').fill('1700000000')
    await expect(page.getByTestId('timestamp-iso')).toHaveText('2023-11-14T22:13:20.000Z')
    await expect(page.getByTestId('timestamp-utc')).toHaveText('Tue, 14 Nov 2023 22:13:20 GMT')
    await expect(page.getByTestId('timestamp-unix-milliseconds')).toHaveText('1700000000000')
  })

  test('converts an ISO date back to Unix', async ({ page }) => {
    await page.goto('/timestamp')
    await page.getByLabel('Timestamp or date').fill('2023-11-14T22:13:20Z')
    await expect(page.getByTestId('timestamp-unix-seconds')).toHaveText('1700000000')
  })

  test('now button fills the current time', async ({ page }) => {
    await page.goto('/timestamp')
    await page.getByRole('button', { name: 'Now', exact: true }).click()
    const value = Number(await page.getByLabel('Timestamp or date').inputValue())
    expect(Math.abs(value - Date.now() / 1000)).toBeLessThan(30)
    await expect(page.getByTestId('timestamp-iso')).toBeVisible()
  })

  test('shows an error for garbage input', async ({ page }) => {
    await page.goto('/timestamp')
    await page.getByLabel('Timestamp or date').fill('not a date')
    await expect(page.getByTestId('timestamp-error')).toBeVisible()
  })
})

test.describe('Cron parser', () => {
  test('describes an expression and lists five runs', async ({ page }) => {
    await page.goto('/cron')
    await page.getByLabel('Cron expression').fill('*/5 9-17 * * MON-FRI')
    await expect(page.getByTestId('cron-description')).toContainText('Every 5 minutes')
    await expect(page.getByTestId('cron-run')).toHaveCount(5)
  })

  test('reports an invalid expression', async ({ page }) => {
    await page.goto('/cron')
    await page.getByLabel('Cron expression').fill('99 * * * *')
    await expect(page.getByTestId('cron-error')).toContainText('out of range')
  })

  test('flags schedules that never run', async ({ page }) => {
    await page.goto('/cron')
    await page.getByLabel('Cron expression').fill('0 0 31 2 *')
    await expect(page.getByTestId('cron-never')).toBeVisible()
  })
})

test.describe('Homepage listing', () => {
  test('lists the new tools', async ({ page }) => {
    await page.goto('/')
    for (const name of [/regex tester/i, /text diff/i, /timestamp converter/i, /cron parser/i]) {
      await expect(page.getByRole('link', { name })).toBeVisible()
    }
  })
})

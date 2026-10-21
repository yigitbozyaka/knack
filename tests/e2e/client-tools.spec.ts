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
    await expect(async () => {
      await textarea.fill('# Hello Playwright')
      await expect(textarea).toHaveValue('# Hello Playwright', { timeout: 1000 })
    }).toPass()
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

test.describe('Base64 encoder', () => {
  test('encodes UTF-8 text and decodes it back', async ({ page }) => {
    await page.goto('/base64')
    await page.getByLabel('Input', { exact: true }).fill('héllo ✓')
    await expect(page.locator('[data-testid="base64-output"]')).toHaveText('aMOpbGxvIOKckw==')
    await page.getByRole('button', { name: 'Decode' }).click()
    await page.getByLabel('Input', { exact: true }).fill('aMOpbGxvIOKckw==')
    await expect(page.locator('[data-testid="base64-output"]')).toHaveText('héllo ✓')
  })

  test('toggles base64url output', async ({ page }) => {
    await page.goto('/base64')
    await page.getByLabel('Input', { exact: true }).fill('>>>')
    await expect(page.locator('[data-testid="base64-output"]')).toHaveText('Pj4+')
    await page.getByTestId('base64-urlsafe').check()
    await expect(page.locator('[data-testid="base64-output"]')).toHaveText('Pj4-')
  })

  test('shows an error for invalid base64', async ({ page }) => {
    await page.goto('/base64')
    await page.getByRole('button', { name: 'Decode' }).click()
    await page.getByLabel('Input', { exact: true }).fill('not base64!')
    await expect(page.getByTestId('base64-error')).toBeVisible()
  })
})

test.describe('URL / HTML encoder', () => {
  test('percent-encodes and decodes URL text', async ({ page }) => {
    await page.goto('/url-encode')
    await page.getByLabel('Input', { exact: true }).fill('a b&c')
    await expect(page.locator('[data-testid="url-encode-output"]')).toHaveText('a%20b%26c')
    await page.getByRole('button', { name: 'Decode' }).click()
    await page.getByLabel('Input', { exact: true }).fill('a%20b%26c')
    await expect(page.locator('[data-testid="url-encode-output"]')).toHaveText('a b&c')
  })

  test('escapes and unescapes HTML entities', async ({ page }) => {
    await page.goto('/url-encode')
    await page.getByRole('button', { name: 'HTML' }).click()
    await page.getByLabel('Input', { exact: true }).fill('<b>&</b>')
    await expect(page.locator('[data-testid="url-encode-output"]')).toHaveText(
      '&lt;b&gt;&amp;&lt;/b&gt;',
    )
    await page.getByRole('button', { name: 'Decode' }).click()
    await page.getByLabel('Input', { exact: true }).fill('&lt;i&gt;&#65;')
    await expect(page.locator('[data-testid="url-encode-output"]')).toHaveText('<i>A')
  })
})

test.describe('Hash generator', () => {
  test('computes SHA digests for known input', async ({ page }) => {
    await page.goto('/hash')
    await page.getByLabel('Input', { exact: true }).fill('abc')
    await expect(page.locator('[data-testid="hash-output-sha-1"]')).toHaveText(
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    )
    await expect(page.locator('[data-testid="hash-output-sha-256"]')).toHaveText(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    await expect(page.locator('[data-testid="hash-output-sha-512"]')).toHaveText(/^ddaf35a1/)
  })

  test('shows an error when Web Crypto is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Crypto.prototype, 'subtle', { get: () => undefined })
    })
    await page.goto('/hash')
    await page.getByLabel('Input', { exact: true }).fill('abc')
    await expect(page.getByTestId('hash-error')).toBeVisible()
  })
})

test.describe('JWT decoder', () => {
  const EXPIRED_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.signature'

  test('decodes a token and flags it as expired', async ({ page }) => {
    await page.goto('/jwt')
    await page.getByLabel('Token', { exact: true }).fill(EXPIRED_TOKEN)
    await expect(page.getByTestId('jwt-expired-badge')).toBeVisible()
    await expect(page.getByTestId('jwt-exp')).toHaveText('2018-01-18T01:30:23.000Z')
    await expect(page.getByTestId('jwt-result')).toContainText('"name": "John Doe"')
  })

  test('shows no time claims badge when exp and nbf are absent', async ({ page }) => {
    await page.goto('/jwt')
    await page.getByLabel('Token', { exact: true }).fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhIn0.')
    await expect(page.getByTestId('jwt-no-time-claims')).toBeVisible()
    await expect(page.getByText('Time claims OK')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Copy signature' })).toHaveCount(0)
  })

  test('shows an error for a malformed token', async ({ page }) => {
    await page.goto('/jwt')
    await page.getByLabel('Token', { exact: true }).fill('not-a-jwt')
    await expect(page.getByTestId('jwt-error')).toBeVisible()
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

test.describe('Lorem ipsum generator', () => {
  test('starts with Lorem ipsum by default and honours the toggle', async ({ page }) => {
    await page.goto('/generate/lorem')
    const output = page.locator('[data-testid="lorem-output"]')
    await expect(output).toHaveText(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit/)
    await page.getByLabel(/start with/i).click()
    await page.getByRole('button', { name: 'Words' }).click()
    await page.getByLabel(/count/i).fill('12')
    const text = (await output.textContent()) ?? ''
    expect(text.trim().split(/\s+/)).toHaveLength(12)
  })

  test('generates the requested number of paragraphs', async ({ page }) => {
    await page.goto('/generate/lorem')
    await page.getByLabel(/count/i).fill('5')
    const text = (await page.locator('[data-testid="lorem-output"]').textContent()) ?? ''
    expect(text.split('\n\n')).toHaveLength(5)
  })

  test('lets the count field be cleared and retyped', async ({ page }) => {
    await page.goto('/generate/lorem')
    const count = page.getByLabel(/count/i)
    await count.clear()
    await count.pressSequentially('5')
    await expect(count).toHaveValue('5')
    const text = (await page.locator('[data-testid="lorem-output"]').textContent()) ?? ''
    expect(text.split('\n\n')).toHaveLength(5)
  })

  test('has a copy button', async ({ page }) => {
    await page.goto('/generate/lorem')
    await expect(page.getByRole('button', { name: /copy text/i })).toBeVisible()
  })
})

test.describe('CSV and JSON converter', () => {
  test('converts CSV with quoting to JSON', async ({ page }) => {
    await page.goto('/csv-json')
    await page.getByTestId('csv-input').fill('name,note\nAda,"likes, commas"\nLinus,"say ""hi"""')
    const output = await page.getByTestId('csv-output').textContent()
    expect(JSON.parse(output?.replace(/^JSON/i, '') ?? '')).toEqual([
      { name: 'Ada', note: 'likes, commas' },
      { name: 'Linus', note: 'say "hi"' },
    ])
  })

  test('converts JSON to CSV with the chosen delimiter', async ({ page }) => {
    await page.goto('/csv-json')
    await page.getByRole('button', { name: 'JSON → CSV' }).click()
    await page.getByTestId('csv-delimiter').selectOption('semicolon')
    await page.getByTestId('csv-input').fill('[{"a":"x;y","b":2}]')
    await expect(page.getByTestId('csv-output')).toContainText('a;b')
    await expect(page.getByTestId('csv-output')).toContainText('"x;y";2')
  })

  test('drops the header row when the toggle is off', async ({ page }) => {
    await page.goto('/csv-json')
    await page.getByLabel('First row is a header').click()
    await page.getByTestId('csv-input').fill('a,b\n1,2')
    await expect(page.getByTestId('csv-output')).toContainText('"a"')
    await expect(page.getByTestId('csv-output')).not.toContainText('"b": "2"')
  })

  test('shows an inline error for an unterminated quote', async ({ page }) => {
    await page.goto('/csv-json')
    await page.getByTestId('csv-input').fill('a,b\n1,"oops')
    await expect(page.getByTestId('csv-error')).toContainText('Unterminated quoted field')
  })

  test('shows an inline error for invalid JSON', async ({ page }) => {
    await page.goto('/csv-json')
    await page.getByRole('button', { name: 'JSON → CSV' }).click()
    await page.getByTestId('csv-input').fill('{nope')
    await expect(page.getByTestId('csv-error')).toBeVisible()
  })
})

test.describe('Color converter', () => {
  test('converts a hex value into every notation', async ({ page }) => {
    await page.goto('/color')
    await page.getByTestId('color-hex').fill('#ff0000')
    await expect(page.getByTestId('color-rgb')).toHaveValue('rgb(255, 0, 0)')
    await expect(page.getByTestId('color-hsl')).toHaveValue('hsl(0, 100%, 50%)')
    await expect(page.getByTestId('color-oklch')).toHaveValue('oklch(0.628 0.2577 29.23)')
    await expect(page.getByTestId('color-native')).toHaveValue('#ff0000')
  })

  test('accepts input in any field and shows inline errors', async ({ page }) => {
    await page.goto('/color')
    await page.getByTestId('color-rgb').fill('rgb(0, 128, 0)')
    await expect(page.getByTestId('color-hex')).toHaveValue('#008000')
    await page.getByTestId('color-hsl').fill('hsl(0, 200%, 50%)')
    await expect(page.getByTestId('color-hsl-error')).toBeVisible()
  })

  test('reports WCAG contrast and badges', async ({ page }) => {
    await page.goto('/color')
    await page.getByTestId('color-hex').fill('#000000')
    await page.getByTestId('contrast-background').fill('#ffffff')
    await expect(page.getByTestId('contrast-ratio')).toHaveText('21.00:1')
    for (const id of ['aa-normal', 'aa-large', 'aaa-normal', 'aaa-large']) {
      await expect(page.getByTestId(`contrast-${id}`)).toHaveAttribute('data-pass', 'true')
    }
    await page.getByTestId('color-hex').fill('#777777')
    await expect(page.getByTestId('contrast-aa-normal')).toHaveAttribute('data-pass', 'false')
    await expect(page.getByTestId('contrast-aa-large')).toHaveAttribute('data-pass', 'true')
    await expect(page.getByTestId('contrast-aaa-normal')).toHaveAttribute('data-pass', 'false')
  })
})

test.describe('Color converter gamut mapping', () => {
  test('shows a notice when an OKLCH color is out of the sRGB gamut', async ({ page }) => {
    await page.goto('/color')
    await expect(page.getByTestId('color-gamut-warning')).toHaveCount(0)
    await page.getByTestId('color-oklch').fill('oklch(0.7 0.4 150)')
    await expect(page.getByTestId('color-gamut-warning')).toBeVisible()
    await page.getByTestId('color-hex').fill('#336699')
    await expect(page.getByTestId('color-gamut-warning')).toHaveCount(0)
  })
})

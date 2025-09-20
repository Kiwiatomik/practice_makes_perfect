import { Page, expect } from '@playwright/test'

const TEST_USER_EMAIL = 'e2e.test@example.com'
const TEST_USER_PASSWORD = 'testpassword123'

export async function signUp(page: Page) {
  await page.goto('/')

  await page.getByRole('button', { name: 'Register' }).click()

  await page.fill('input[type="email"]', TEST_USER_EMAIL)
  await page.fill('input[type="password"]', TEST_USER_PASSWORD)

  await page.getByRole('button', { name: 'Register' }).click()

  await expect(page.getByText('Account')).toBeVisible({ timeout: 10000 })
}

export async function signIn(page: Page) {
  await page.goto('/')

  await page.getByRole('button', { name: 'Login' }).click()

  await page.fill('input[type="email"]', TEST_USER_EMAIL)
  await page.fill('input[type="password"]', TEST_USER_PASSWORD)

  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page.getByText('Account')).toBeVisible({ timeout: 10000 })
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account' }).click()
  await page.getByRole('button', { name: 'Logout' }).click()

  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
}
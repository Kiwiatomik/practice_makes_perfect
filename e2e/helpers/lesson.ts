import { Page, expect } from '@playwright/test'

export async function submitAnswer(page: Page, answer: string) {
  await page.fill('textarea[placeholder*="answer"]', answer)
  await page.getByRole('button', { name: 'Submit Answer' }).click()

  await expect(page.getByText('Solution')).toBeVisible({ timeout: 15000 })
}

export async function requestPracticeQuestion(page: Page) {
  await page.getByRole('button', { name: 'Practice Again' }).click()

  await expect(page.getByText('Loading')).toBeVisible()
  await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 30000 })

  await expect(page.getByText('Question')).toBeVisible()
}

export async function requestNextLevelQuestion(page: Page) {
  await page.getByRole('button', { name: 'Next Level' }).click()

  await expect(page.getByText('Loading')).toBeVisible()
  await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 30000 })

  await expect(page.getByText('Question')).toBeVisible()
}

export async function closeQuestionModal(page: Page) {
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByText('Question')).not.toBeVisible()
}
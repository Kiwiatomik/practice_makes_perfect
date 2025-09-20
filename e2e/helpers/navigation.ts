import { Page, expect } from '@playwright/test'

export async function navigateToCourses(page: Page) {
  await page.getByRole('link', { name: 'Browse Courses' }).click()
  await expect(page.getByText('Browse Courses')).toBeVisible()
}

export async function selectCourse(page: Page, courseName: string) {
  await page.getByText(courseName).first().click()
  await expect(page.getByText(courseName)).toBeVisible()
}

export async function selectLesson(page: Page, lessonTitle: string) {
  await page.getByText(lessonTitle).click()
  await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toBeVisible()
}
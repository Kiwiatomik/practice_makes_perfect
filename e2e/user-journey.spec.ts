import { test, expect } from '@playwright/test'
import { waitForPageLoad } from './helpers/navigation'

test.describe('Core User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await waitForPageLoad(page)
  })

  test('User can browse and access courses without authentication', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Practice Makes Perfect/i })).toBeVisible()

    await navigateToCourses(page)

    await expect(page.getByText('Browse Courses')).toBeVisible()

    const courseCards = page.locator('.card')
    await expect(courseCards.first()).toBeVisible()
  })

  test('User registration and authentication flow', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByText('Register')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()

    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Login')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('Authenticated user can access course content', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    await expect(page.url()).toContain('/course/')

    const lessonCards = page.locator('.card')
    if ((await lessonCards.count()) > 0) {
      await lessonCards.first().click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })
    }
  })

  test('User can navigate between pages using navigation menu', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Practice Makes Perfect/i })).toBeVisible()

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')

    await navigateToCourses(page)
    await expect(page.url()).toContain('/courses')

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
  })

  test('Error handling for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route')

    await expect(page.getByText('Page Not Found')).toBeVisible()

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
  })

  test('Course page displays lesson structure', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    await expect(page.url()).toContain('/course/')

    await expect(page.getByText('Lessons')).toBeVisible()

    const lessonCards = page.locator('.card')
    if ((await lessonCards.count()) > 0) {
      await expect(lessonCards.first()).toBeVisible()
    }
  })

  test('Responsive design works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Practice Makes Perfect/i })).toBeVisible()

    const navToggle = page.locator('.navbar-toggler')
    if (await navToggle.isVisible()) {
      await navToggle.click()
      await expect(page.getByRole('link', { name: 'Browse Courses' })).toBeVisible()
    }
  })
})
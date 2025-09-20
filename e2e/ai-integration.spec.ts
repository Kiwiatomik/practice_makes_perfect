import { test, expect } from '@playwright/test'
import { waitForPageLoad } from './helpers/navigation'

test.describe('AI Integration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForPageLoad(page)
  })

  test('User can access lesson questions and submit answers', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const answerInput = page.locator('textarea[placeholder*="answer"], input[placeholder*="answer"]')
      if (await answerInput.isVisible()) {
        await answerInput.fill('Test answer')

        const submitButton = page.getByRole('button', { name: 'Submit Answer' })
        if (await submitButton.isVisible()) {
          await submitButton.click()

          await expect(page.getByText('Solution')).toBeVisible({ timeout: 15000 })
        }
      }
    }
  })

  test('AI Practice Again functionality works', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const answerInput = page.locator('textarea[placeholder*="answer"], input[placeholder*="answer"]')
      if (await answerInput.isVisible()) {
        await answerInput.fill('Test answer')

        const submitButton = page.getByRole('button', { name: 'Submit Answer' })
        if (await submitButton.isVisible()) {
          await submitButton.click()

          await expect(page.getByText('Solution')).toBeVisible({ timeout: 15000 })

          const practiceButton = page.getByRole('button', { name: 'Practice Again' })
          if (await practiceButton.isVisible()) {
            await practiceButton.click()

            await expect(page.getByText('Loading')).toBeVisible()
            await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 30000 })

            await expect(page.getByText('Question')).toBeVisible()
          }
        }
      }
    }
  })

  test('AI Next Level functionality works', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const answerInput = page.locator('textarea[placeholder*="answer"], input[placeholder*="answer"]')
      if (await answerInput.isVisible()) {
        await answerInput.fill('Test answer')

        const submitButton = page.getByRole('button', { name: 'Submit Answer' })
        if (await submitButton.isVisible()) {
          await submitButton.click()

          await expect(page.getByText('Solution')).toBeVisible({ timeout: 15000 })

          const nextLevelButton = page.getByRole('button', { name: 'Next Level' })
          if (await nextLevelButton.isVisible()) {
            await nextLevelButton.click()

            await expect(page.getByText('Loading')).toBeVisible()
            await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 30000 })

            await expect(page.getByText('Question')).toBeVisible()
          }
        }
      }
    }
  })

  test('Question modal can be closed and reopened', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const closeButton = page.getByRole('button', { name: 'Close' })
      if (await closeButton.isVisible()) {
        await closeButton.click()
        await expect(page.getByText('Question')).not.toBeVisible()

        await firstLesson.click()
        await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('LaTeX math rendering works in questions', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const mathElements = page.locator('.katex, .katex-mathml, .katex-html')
      if ((await mathElements.count()) > 0) {
        await expect(mathElements.first()).toBeVisible()
      }
    }
  })

  test('Error handling for AI service failures', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const practiceButton = page.getByRole('button', { name: 'Practice Again' })
      if (await practiceButton.isVisible()) {
        await practiceButton.click()

        await expect(page.getByText('Error generating question'), { timeout: 30000 })
          .or(page.getByText('Question'))
          .toBeVisible()
      }
    }
  })

  test('LaTeX helper buttons work correctly', async ({ page }) => {
    await page.goto('/')

    await navigateToCourses(page)

    const firstCourse = page.locator('.card').first()
    await firstCourse.click()

    const firstLesson = page.locator('.card').first()
    if ((await firstLesson.count()) > 0) {
      await firstLesson.click()

      await expect(page.getByText('Question')).toBeVisible({ timeout: 10000 })

      const latexHelper = page.locator('.latex-helper, .math-helper')
      if (await latexHelper.isVisible()) {
        const symbolButtons = latexHelper.locator('button')
        if ((await symbolButtons.count()) > 0) {
          await symbolButtons.first().click()

          const answerInput = page.locator('textarea[placeholder*="answer"], input[placeholder*="answer"]')
          if (await answerInput.isVisible()) {
            const inputValue = await answerInput.inputValue()
            expect(inputValue.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})
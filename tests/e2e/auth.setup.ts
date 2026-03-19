import { expect, test } from '@playwright/test'

test('cria storage states de auth', async ({ browser }) => {
  const admin = await browser.newPage()
  await admin.goto('/login')
  await admin.getByLabel('E-mail').fill('admin@admin.com')
  await admin.getByLabel('Senha').fill('admin')
  await admin.getByRole('button', { name: 'Entrar' }).click()
  await expect(admin).toHaveURL(/dashboard/)
  await admin.context().storageState({ path: 'tests/e2e/.auth/admin.json' })
  await admin.close()

  const viewer = await browser.newPage()
  await viewer.goto('/login')
  await viewer.getByLabel('E-mail').fill('viewer@admin.com')
  await viewer.getByLabel('Senha').fill('admin')
  await viewer.getByRole('button', { name: 'Entrar' }).click()
  await expect(viewer).toHaveURL(/dashboard/)
  await viewer.context().storageState({ path: 'tests/e2e/.auth/viewer.json' })
  await viewer.close()
})

import { financeMock, type FinanceOverview } from '../mocks/finance'
import { sleep } from '../utils/sleep'

export async function getFinanceOverview(): Promise<FinanceOverview> {
  await sleep(450)
  return financeMock
}

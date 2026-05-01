import { apiFetch } from './client'

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed JSON for successful responses', async () => {
    const responseBody = { status: 'ok' }
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseBody),
    })

    const result = await apiFetch('/health', { method: 'GET' })

    expect(fetchMock).toHaveBeenCalledWith('/api/health', { method: 'GET' })
    expect(result).toEqual(responseBody)
  })

  it('throws a helpful error for non-ok responses', async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    })

    await expect(apiFetch('/health')).rejects.toThrow(
      'API error 500: Server Error',
    )
  })
})

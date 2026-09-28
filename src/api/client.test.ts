import { afterEach, describe, expect, it, vi } from 'vitest'

// Each test imports a fresh copy of the module so the in-memory access token
// and the single-flight refresh promise never leak between tests.
async function freshClient() {
  vi.resetModules()
  return import('./client')
}

const user = { id: '1', name: 'Ada', email: 'ada@example.com', role: 'VIEWER' as const }

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('rawRequest', () => {
  it('attaches the in-memory access token as a bearer header', async () => {
    const { rawRequest, setAccessToken } = await freshClient()
    setAccessToken('token-123')

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }, 200))
    vi.stubGlobal('fetch', fetchMock)

    await rawRequest('/api/whatever')

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer token-123')
    expect(init.credentials).toBe('include')
  })

  it('throws an ApiError with the server message and field details', async () => {
    const { rawRequest, ApiError } = await freshClient()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () =>
        jsonResponse({ error: 'Validation failed', details: [{ field: 'email', message: 'Invalid email' }] }, 400),
      ),
    )

    const error = await rawRequest('/api/auth/register').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: [{ field: 'email', message: 'Invalid email' }],
    })
  })
})

describe('refreshSession', () => {
  it('is single-flight: concurrent calls only send one request (covers React StrictMode double-invoking effects)', async () => {
    const { refreshSession, getAccessToken } = await freshClient()

    let refreshCalls = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      refreshCalls += 1
      return jsonResponse({ accessToken: 'fresh-token', user }, 200)
    })
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([refreshSession(), refreshSession()])

    expect(refreshCalls).toBe(1)
    expect(first).toEqual({ accessToken: 'fresh-token', user })
    expect(second).toEqual({ accessToken: 'fresh-token', user })
    expect(getAccessToken()).toBe('fresh-token')
  })

  it('allows a new refresh once the previous one has settled', async () => {
    const { refreshSession } = await freshClient()

    let refreshCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        refreshCalls += 1
        return jsonResponse({ accessToken: `token-${refreshCalls}`, user }, 200)
      }),
    )

    await refreshSession()
    await refreshSession()

    expect(refreshCalls).toBe(2)
  })
})

describe('request', () => {
  it('two parallel 401s trigger only one refresh call, then both retries succeed', async () => {
    const { request, setAccessToken } = await freshClient()
    setAccessToken('expired-token')

    let refreshCalls = 0
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/auth/refresh') {
        refreshCalls += 1
        return jsonResponse({ accessToken: 'new-token', user }, 200)
      }

      const headers = new Headers(init?.headers)
      if (headers.get('Authorization') === 'Bearer new-token') {
        return jsonResponse({ data: 'ok' }, 200)
      }
      return jsonResponse({ error: 'Unauthorized' }, 401)
    })
    vi.stubGlobal('fetch', fetchMock)

    const [a, b] = await Promise.all([request('/api/protected'), request('/api/protected')])

    expect(a).toEqual({ data: 'ok' })
    expect(b).toEqual({ data: 'ok' })
    expect(refreshCalls).toBe(1)
  })

  it('clears the token and calls onAuthFailure when the refresh itself fails', async () => {
    const { request, setAccessToken, setOnAuthFailure, getAccessToken } = await freshClient()
    setAccessToken('expired-token')

    const onAuthFailure = vi.fn()
    setOnAuthFailure(onAuthFailure)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url === '/api/auth/refresh') {
          return jsonResponse({ error: 'Missing refresh token' }, 401)
        }
        return jsonResponse({ error: 'Unauthorized' }, 401)
      }),
    )

    await expect(request('/api/protected')).rejects.toMatchObject({ status: 401, message: 'Unauthorized' })
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  it('does not touch the network again for a non-401 error', async () => {
    const { request, setAccessToken } = await freshClient()
    setAccessToken('token')

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'Server exploded' }, 500))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/api/protected')).rejects.toMatchObject({ status: 500 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

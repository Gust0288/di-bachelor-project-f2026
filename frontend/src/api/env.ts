declare const __API_BASE_URL__: string | undefined

export function getApiBaseUrl() {
  return typeof __API_BASE_URL__ === 'string' && __API_BASE_URL__.length > 0
    ? __API_BASE_URL__
    : '/api'
}

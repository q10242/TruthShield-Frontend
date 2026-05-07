const DEFAULT_UPLOAD_FIELD = 'image'
const DEFAULT_URL_PATH = 'data.link'
const DEFAULT_MAX_SIZE_MB = 10

const endpoint = import.meta.env.VITE_EVIDENCE_UPLOAD_ENDPOINT || ''
const uploadField = import.meta.env.VITE_EVIDENCE_UPLOAD_FIELD || DEFAULT_UPLOAD_FIELD
const urlPath = import.meta.env.VITE_EVIDENCE_UPLOAD_URL_PATH || DEFAULT_URL_PATH
const authHeader = import.meta.env.VITE_EVIDENCE_UPLOAD_AUTH_HEADER || ''
const authValue = import.meta.env.VITE_EVIDENCE_UPLOAD_AUTH_VALUE || ''
const extraFields = import.meta.env.VITE_EVIDENCE_UPLOAD_EXTRA_FIELDS || ''
const maxSizeMb = Number(import.meta.env.VITE_EVIDENCE_UPLOAD_MAX_MB || DEFAULT_MAX_SIZE_MB)

export const evidenceUploadConfig = {
  enabled: Boolean(endpoint),
  endpoint,
  maxSizeMb,
  openImageHostUrl: import.meta.env.VITE_EVIDENCE_IMAGE_HOST_URL || 'https://imgur.com/upload',
  openCloudDriveUrl: import.meta.env.VITE_EVIDENCE_CLOUD_DRIVE_URL || 'https://drive.google.com/drive/my-drive',
}

export function validateEvidenceImage(file) {
  if (!file) return { ok: false, reason: 'missing' }

  if (!file.type?.startsWith('image/')) {
    return { ok: false, reason: 'type' }
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return { ok: false, reason: 'size' }
  }

  return { ok: true }
}

export async function uploadEvidenceImage(file) {
  if (!endpoint) {
    throw new Error('Evidence upload endpoint is not configured.')
  }

  const validation = validateEvidenceImage(file)
  if (!validation.ok) {
    const error = new Error(validation.reason)
    error.reason = validation.reason
    throw error
  }

  const body = new FormData()
  body.append(uploadField, file)

  for (const [key, value] of configuredExtraFields()) {
    body.append(key, value)
  }

  const headers = {}
  if (authHeader && authValue) {
    headers[authHeader] = authValue
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(payload?.message || `Upload failed with ${response.status}`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  const url = valueAtPath(payload, urlPath)

  if (!url || typeof url !== 'string') {
    const error = new Error('Upload succeeded but no public URL was returned.')
    error.payload = payload
    throw error
  }

  return url
}

function configuredExtraFields() {
  if (!extraFields) return []

  try {
    const parsed = JSON.parse(extraFields)
    return Object.entries(parsed).filter(([, value]) => value !== undefined && value !== null)
  } catch {
    return []
  }
}

function valueAtPath(payload, path) {
  return path.split('.').reduce((value, key) => {
    if (value === undefined || value === null) return undefined
    return value[key]
  }, payload)
}

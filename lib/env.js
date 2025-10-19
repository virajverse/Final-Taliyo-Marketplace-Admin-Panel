export const ENV = {
  SUPABASE_URL: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
  ),
  SUPABASE_ANON_KEY: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY)
  ),
  SUPABASE_SERVICE_ROLE_KEY: (
    (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
  ),
  STORAGE_BUCKET: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_STORAGE_BUCKET) ||
    'media-files'
  ),

  USE_SUPABASE_EMAIL: (
    ((typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USE_SUPABASE_EMAIL) ||
     (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USE_SUPABASE_EMAIL)) === 'true'
  ),
  DEV_MODE: (
    ((typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DEV_MODE) ||
     (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEV_MODE)) === 'true'
  ),

  FROM_EMAIL: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FROM_EMAIL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FROM_EMAIL)
  ),
  RESEND_FROM_SUPPORT: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_RESEND_FROM_SUPPORT) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RESEND_FROM_SUPPORT)
  ),
  RESEND_FROM_UPDATES: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_RESEND_FROM_UPDATES) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RESEND_FROM_UPDATES)
  ),
  RESEND_FROM_NEWUSER: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_RESEND_FROM_NEWUSER) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RESEND_FROM_NEWUSER)
  ),

  SMTP_HOST: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SMTP_HOST) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SMTP_HOST)
  ),
  SMTP_PORT: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SMTP_PORT) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SMTP_PORT)
  ),
  SMTP_USER: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SMTP_USER) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SMTP_USER)
  ),
  SMTP_PASS: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SMTP_PASS) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SMTP_PASS)
  ),

  VAPID_PUBLIC_KEY: (
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VAPID_PUBLIC_KEY)
  )
}

export const isDevRuntime = (
  (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.DEV) ||
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') ||
  false
)

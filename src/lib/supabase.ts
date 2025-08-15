import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Export a flag to let the app know whether Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Provide a safe fallback stub so the app doesn't crash if env vars are missing
const supabaseStub: any = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null }
    },
    onAuthStateChange(_cb: any) {
      return { data: { subscription: { unsubscribe() { /* noop */ } } } }
    },
    async signInWithOtp() {
      return { data: null, error: { message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' } }
    },
    async signInWithOAuth() {
      return { data: null, error: { message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' } }
    },
    async signOut() {
      return { error: null }
    },
  },
  from() {
    // A minimal chainable query builder that always returns { data, error }
    // and supports common methods used across the app. Awaiting it simply
    // returns the object itself (not a Promise), which is fine for our usage.
    const chain: any = {
      data: [],
      error: null,
      select() { return chain },
      order() { return chain },
      eq() { return chain },
      limit() { return chain },
      range() { return chain },
      single() { return chain },
      maybeSingle() { return chain },
      insert() {
        chain.data = null
        chain.error = { message: 'DB disabled (Supabase not configured).' }
        return chain
      },
      update() {
        chain.data = null
        chain.error = { message: 'DB disabled (Supabase not configured).' }
        return chain
      },
      delete() {
        chain.data = null
        chain.error = { message: 'DB disabled (Supabase not configured).' }
        return chain
      },
    }
    return chain
  },
}

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Running with a read-only stub (no auth, empty data).')
}

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (supabaseStub as any)

export type Strategy = {
  id: number
  created_at: string
  description: string | null
  platforms: string | null
  company_id?: string | null
  angle1_header: string | null
  angle1_description: string | null
  angle1_objective: string | null
  angle1_tonality: string | null
  angle2_header: string | null
  angle2_description: string | null
  angle2_objective: string | null
  angle2_tonality: string | null
  angle3_header: string | null
  angle3_description: string | null
  angle3_objective: string | null
  angle3_tonality: string | null
  angle4_header: string | null
  angle4_description: string | null
  angle4_objective: string | null
  angle4_tonality: string | null
  angle5_header: string | null
  angle5_description: string | null
  angle5_objective: string | null
  angle5_tonality: string | null
  angle6_header: string | null
  angle6_description: string | null
  angle6_objective: string | null
  angle6_tonality: string | null
  angle7_header: string | null
  angle7_description: string | null
  angle7_objective: string | null
  angle7_tonality: string | null
  angle8_header: string | null
  angle8_description: string | null
  angle8_objective: string | null
  angle8_tonality: string | null
  angle9_header: string | null
  angle9_description: string | null
  angle9_objective: string | null
  angle9_tonality: string | null
  angle10_header: string | null
  angle10_description: string | null
  angle10_objective: string | null
  angle10_tonality: string | null
}

export type Company = {
  id: string
  name: string
  brand_voice: {
    tone: string
    style: string
    keywords: string[]
  }
  target_audience: {
    demographics: string
    interests: string[]
    pain_points: string[]
  }
  // Optional raw columns to maintain compatibility with views expecting Supabase shapes
  brand_name?: string | null
  brand_tone?: string | null
  key_offer?: string | null
  target_audience_raw?: string | null
  website?: string | null
  additional_information?: string | null
  created_at: string
}

export type ContentPiece = {
  id: string
  company_id: string
  type: 'blog_post' | 'social_post' | 'ad_copy' | 'email' | 'content_strategy'
  status: 'draft' | 'approved'
  title: string
  body: string
  platform?: string
  strategy_id?: string
  metadata: {
    prompt?: string
    generated_at?: string
    word_count?: number
  }
  created_at: string
}

export type Campaign = {
  id: string
  company_id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  content_pieces: string[]
  schedule: {
    start_date: string
    end_date: string
    platforms: string[]
  }
  created_at: string
}

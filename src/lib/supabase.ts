// Mock data types for development without Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Strategy type based on Supabase table
export type Strategy = {
  id: number
  created_at: string
  platforms: string | null
  brand: string | null
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
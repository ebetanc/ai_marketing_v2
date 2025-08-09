// Mock data types for development without Supabase
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
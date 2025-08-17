import { useState, useEffect, useCallback } from 'react'
import { supabase, type Tables } from '../lib/supabase'

// UI-facing content shape used by Dashboard and other components
export type ContentPiece = {
  id: string
  company_id: string
  type: 'blog_post' | 'social_post' | 'ad_copy' | 'email' | 'content_strategy'
  status: 'draft' | 'approved'
  title: string
  body: string
  platform?: string
  strategy_id?: string
  metadata?: {
    prompt?: string
    generated_at?: string
    word_count?: number
  }
  created_at: string
}

type IdeaRow = Tables<'ideas'>
type TwitterRow = Tables<'twitter_content'> & { idea?: Pick<IdeaRow, 'company_id' | 'strategy_id'> }
type LinkedInRow = Tables<'linkedin_content'> & { idea?: Pick<IdeaRow, 'company_id' | 'strategy_id'> }
type NewsletterRow = Tables<'newsletter_content'> & { idea?: Pick<IdeaRow, 'company_id' | 'strategy_id'> }

export function useContentPieces(companyId?: string) {
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapRow = (row: any, kind: 'twitter' | 'linkedin' | 'newsletter'): ContentPiece => {
    const cid = row.idea?.company_id ?? row.company_id
    const sid = row.idea?.strategy_id ?? row.strategy_id
    const titleFallback =
      typeof row.content_body === 'string' && row.content_body
        ? (row.content_body as string).slice(0, 60) + (row.content_body.length > 60 ? '…' : '')
        : `${kind.charAt(0).toUpperCase() + kind.slice(1)} Content`
    return {
      id: String(row.id),
      company_id: String(cid ?? ''),
      type: kind === 'newsletter' ? 'email' : 'social_post',
      status: row.status === 'approved' || row.post === true ? 'approved' : 'draft',
      title: row.title || titleFallback,
      body: row.content_body || row.body || '',
      platform: kind === 'twitter' ? 'Twitter' : kind === 'linkedin' ? 'LinkedIn' : 'Newsletter',
      strategy_id: sid != null ? String(sid) : undefined,
      created_at: row.created_at,
    }
  }

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [twitterRes, linkedinRes, newsletterRes] = await Promise.all([
        supabase
          .from('twitter_content')
          .select('*, idea:ideas(company_id,strategy_id)')
          .order('created_at', { ascending: false }),
        supabase
          .from('linkedin_content')
          .select('*, idea:ideas(company_id,strategy_id)')
          .order('created_at', { ascending: false }),
        supabase
          .from('newsletter_content')
          .select('*, idea:ideas(company_id,strategy_id)')
          .order('created_at', { ascending: false })
      ])

      if (twitterRes.error || linkedinRes.error || newsletterRes.error) {
        const e = twitterRes.error || linkedinRes.error || newsletterRes.error
        throw new Error(e?.message || 'Failed to load content')
      }

      const twitter = (twitterRes.data as TwitterRow[] | null) || []
      const linkedin = (linkedinRes.data as LinkedInRow[] | null) || []
      const newsletter = (newsletterRes.data as NewsletterRow[] | null) || []

      let all = [
        ...twitter.map((r) => mapRow(r, 'twitter')),
        ...linkedin.map((r) => mapRow(r, 'linkedin')),
        ...newsletter.map((r) => mapRow(r, 'newsletter')),
      ]

      // Optional company filter
      if (companyId) {
        all = all.filter((c) => c.company_id === String(companyId))
      }

      // Sort newest first
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setContentPieces(all)
    } catch (err) {
      setContentPieces([])
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    contentPieces,
    loading,
    error,
    refetch: fetchContent,
  }
}

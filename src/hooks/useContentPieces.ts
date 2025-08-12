import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useContentPieces(companyId?: string) {
  const [contentPieces, setContentPieces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContentFromSupabase = async () => {
    try {
      setLoading(true)
      console.log('Fetching content from Supabase...')

      // Fetch from all three content tables
      const [twitterRes, linkedinRes, newsletterRes] = await Promise.all([
        supabase.from('twitter_content').select('*, idea:ideas(*, company:companies(*))').order('created_at', { ascending: false }),
        supabase.from('linkedin_content').select('*, idea:ideas(*, company:companies(*))').order('created_at', { ascending: false }),
        supabase.from('newsletter_content').select('*, idea:ideas(*, company:companies(*))').order('created_at', { ascending: false })
      ])

      const allContent = []

      // Process Twitter content
      if (twitterRes.data && !twitterRes.error) {
        const twitterContent = twitterRes.data.map(item => ({
          ...item,
          source: 'twitter_content',
          platform: 'Twitter',
          type: 'social_post',
          title: item.title || 'Twitter Content',
          status: item.status || 'draft',
          company_id: item.idea?.company_id,
          brand_name: item.idea?.company?.brand_name || 'Unknown Brand',
          body: item.content_body || 'No content available'
        }))
        allContent.push(...twitterContent)
      }

      // Process LinkedIn content
      if (linkedinRes.data && !linkedinRes.error) {
        const linkedinContent = linkedinRes.data.map(item => ({
          ...item,
          source: 'linkedin_content',
          platform: 'LinkedIn',
          type: 'social_post',
          title: item.title || item.content_body?.substring(0, 50) + '...' || 'LinkedIn Content',
          status: item.status || 'draft',
          company_id: item.idea?.company_id,
          brand_name: item.idea?.company?.brand_name || 'Unknown Brand',
          body: item.content_body || 'No content available'
        }))
        allContent.push(...linkedinContent)
      }

      // Process Newsletter content
      if (newsletterRes.data && !newsletterRes.error) {
        const newsletterContent = newsletterRes.data.map(item => ({
          ...item,
          source: 'newsletter_content',
          platform: 'Newsletter',
          type: 'email',
          title: item.title || item.content_body?.substring(0, 50) + '...' || 'Newsletter Content',
          status: item.status || 'draft',
          company_id: item.idea?.company_id,
          brand_name: item.idea?.company?.brand_name || 'Unknown Brand',
          body: item.content_body || 'No content available'
        }))
        allContent.push(...newsletterContent)
      }

      // Filter by company if specified
      const filteredContent = companyId
        ? allContent.filter(content => String(content.company_id) === String(companyId))
        : allContent

      // Sort by created_at (most recent first)
      filteredContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setContentPieces(filteredContent)
    } catch (error) {
      console.error('Error fetching content from Supabase:', error)
      setContentPieces([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContentFromSupabase()
  }, [companyId])

  const refetch = () => {
    setLoading(true)
    fetchContentFromSupabase()
  }

  return {
    contentPieces,
    loading,
    refetch
  }
}
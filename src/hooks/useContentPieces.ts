import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useContentPieces() {
  const [contentPieces, setContentPieces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [twitterRes, linkedinRes, newsletterRes] = await Promise.all([
          supabase.from('twitter_content').select('*').order('created_at', { ascending: false }),
          supabase.from('linkedin_content').select('*').order('created_at', { ascending: false }),
          supabase.from('newsletter_content').select('*').order('created_at', { ascending: false })
        ])

        const allContent = []
        
        if (twitterRes.data) {
          allContent.push(...twitterRes.data.map(item => ({ ...item, type: 'social_post', status: 'draft' })))
        }
        if (linkedinRes.data) {
          allContent.push(...linkedinRes.data.map(item => ({ ...item, type: 'social_post', status: 'draft' })))
        }
        if (newsletterRes.data) {
          allContent.push(...newsletterRes.data.map(item => ({ ...item, type: 'email', status: 'draft' })))
        }

        setContentPieces(allContent)
      } catch (error) {
        setContentPieces([])
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  return { contentPieces, loading }
}
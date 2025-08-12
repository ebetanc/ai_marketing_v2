import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompaniesFromSupabase = async () => {
    try {
      setLoading(true)
      console.log('Fetching companies from Supabase...')

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching companies:', error)
        throw error
      }

      console.log('Companies fetched successfully:', data?.length || 0, 'records')
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompaniesFromSupabase()
  }, [])

  const refetch = () => {
    setLoading(true)
    fetchCompaniesFromSupabase()
  }

  return {
    companies,
    loading,
    refetch
  }
}
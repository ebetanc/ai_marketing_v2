import { useEffect, useState } from 'react'
import type { Company } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompaniesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

  if (error) {
        console.error('Error fetching companies:', error)
        throw error
      }

      const supabaseCompanies: Company[] = (data || []).map((company: any) => ({
        id: String(company.id),
        name: company.brand_name || 'Unnamed Brand',
        brand_voice: {
          tone: company.brand_tone || 'Not specified',
          style: company.key_offer || 'Not specified',
          keywords: company.key_offer ? company.key_offer.split(' ').slice(0, 4) : []
        },
        target_audience: {
          demographics: company.target_audience || 'Not specified',
          interests: [],
          pain_points: []
        },
        // Back-compat fields used by some views
        brand_name: company.brand_name ?? null,
        brand_tone: company.brand_tone ?? null,
        key_offer: company.key_offer ?? null,
        target_audience_raw: company.target_audience ?? null,
        website: company.website ?? null,
        additional_information: company.additional_information ?? null,
        created_at: company.created_at
      }))

      setCompanies(supabaseCompanies)
      setError(null)
    } catch (error) {
      console.error('Error fetching companies from Supabase:', error)
      setCompanies([])
      setError(error instanceof Error ? error.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompaniesFromSupabase()
  }, [])

  const createCompany = async (companyData: Omit<Company, 'id' | 'created_at'>) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...companyData
    }

    setCompanies(prev => [...prev, newCompany])
    return { data: newCompany, error: null }
  }

  const deleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (error) {
        console.error('Error deleting company:', error)
        return { error: error.message }
      }

      setCompanies(prev => prev.filter(company => company.id !== companyId))
      return { error: null }
    } catch (error) {
      console.error('Error deleting company:', error)
      return { error: 'Failed to delete company' }
    }
  }
  const refetch = () => {
    setLoading(true)
    fetchCompaniesFromSupabase()
  }

  return {
    companies,
    loading,
  error,
    createCompany,
    deleteCompany,
    refetch
  }
}

import { useState, useEffect } from 'react'
import type { Company } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

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

      const supabaseCompanies: Company[] = (data || []).map(company => ({
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
        created_at: company.created_at
      }))

      setCompanies(supabaseCompanies)
    } catch (error) {
      console.error('Error fetching companies from Supabase:', error)
      setCompanies([])
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
    createCompany,
    deleteCompany,
    refetch
  }
}
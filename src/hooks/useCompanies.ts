import { useState, useEffect } from 'react'
import type { Company } from '../lib/supabase'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'


export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompaniesFromFirebase = async () => {
    try {
      const brandsCollection = collection(db, 'brands')
      const brandsSnapshot = await getDocs(brandsCollection)
      
      const firebaseCompanies: Company[] = brandsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || 'Unnamed Brand',
          brand_voice: {
            tone: data.brandTone || 'Not specified',
            style: data.keyOffer || 'Not specified',
            keywords: data.keyOffer ? data.keyOffer.split(' ').slice(0, 4) : []
          },
          target_audience: {
            demographics: data.targetAudience || 'Not specified',
            interests: [],
            pain_points: []
          },
          created_at: data.createdAt || new Date().toISOString()
        }
      })
      
      setCompanies(firebaseCompanies)
    } catch (error) {
      console.error('Error fetching brands from Firebase:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchCompaniesFromFirebase()
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
      // Delete from Firebase
      await deleteDoc(doc(db, 'brands', companyId))
      
      // Update local state
      setCompanies(prev => prev.filter(company => company.id !== companyId))
      
      return { error: null }
    } catch (error) {
      console.error('Error deleting company:', error)
      return { error: 'Failed to delete company' }
    }
  }
  const refetch = () => {
    setLoading(true)
    fetchCompaniesFromFirebase()
  }

  return {
    companies,
    loading,
    createCompany,
    deleteCompany,
    refetch
  }
}
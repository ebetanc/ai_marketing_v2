import { useState, useEffect } from 'react'

type ContentPiece = {
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

// Mock content data
const mockContent: ContentPiece[] = [
  {
    id: '1',
    company_id: '1',
    type: 'blog_post',
    status: 'draft',
    title: 'The Future of Digital Transformation in Enterprise',
    body: 'Digital transformation has become more than just a buzzword—it\'s a critical imperative for businesses looking to stay competitive in today\'s rapidly evolving marketplace. As organizations navigate the complexities of modernizing their operations, they face numerous challenges that require strategic planning and innovative solutions...',
    metadata: {
      prompt: 'Write a blog post about digital transformation trends',
      generated_at: new Date().toISOString(),
      word_count: 1247
    },
    created_at: '2024-01-30T10:00:00Z'
  },
  {
    id: '2',
    company_id: '1',
    type: 'social_post',
    status: 'approved',
    title: '🚀 Innovation Never Stops',
    body: '🚀 Innovation never stops at TechCorp! Our latest AI-powered solutions are helping businesses scale faster than ever. Ready to transform your operations? Let\'s talk! #Innovation #TechSolutions #AI',
    metadata: {
      prompt: 'Create a social media post about our AI solutions',
      generated_at: new Date().toISOString(),
      word_count: 45
    },
    created_at: '2024-01-30T14:30:00Z'
  },
]

export function useContentPieces(companyId?: string) {
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      const filteredContent = companyId
        ? mockContent.filter(content => content.company_id === companyId)
        : mockContent

      setContentPieces(filteredContent)
      setLoading(false)
    }, 500)
  }, [companyId])

  const generateContent = async (prompt: string, type: ContentPiece['type'], companyId: string) => {
    setGenerating(true)

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    const newContent: ContentPiece = {
      id: Date.now().toString(),
      company_id: companyId,
      type,
      status: 'draft',
      title: generateTitleFromPrompt(prompt, type),
      body: generateBodyFromPrompt(prompt, type),
      metadata: {
        prompt,
        generated_at: new Date().toISOString(),
        word_count: Math.floor(Math.random() * 500) + 100
      },
      created_at: new Date().toISOString()
    }

    setContentPieces(prev => [newContent, ...prev])
    setGenerating(false)

    return { data: newContent, error: null }
  }

  const updateContentStatus = async (id: string, status: ContentPiece['status']) => {
    setContentPieces(prev =>
      prev.map(content =>
        content.id === id ? { ...content, status } : content
      )
    )
  }

  const refetch = () => {
    setLoading(true)
    setTimeout(() => {
      const filteredContent = companyId
        ? mockContent.filter(content => content.company_id === companyId)
        : mockContent

      setContentPieces(filteredContent)
      setLoading(false)
    }, 500)
  }

  return {
    contentPieces,
    loading,
    generating,
    generateContent,
    updateContentStatus,
    refetch
  }
}

function generateTitleFromPrompt(prompt: string, type: ContentPiece['type']): string {
  const titles = {
    blog_post: [
      'Mastering the Art of Digital Innovation',
      'The Complete Guide to Modern Business Solutions',
      'Transform Your Business with These Proven Strategies',
      'Unlocking Success in the Digital Age',
      'The Future of Industry Leadership'
    ],
    social_post: [
      '🎯 Ready to Level Up Your Game?',
      '✨ Innovation Meets Excellence',
      '🚀 The Future is Here',
      '💡 Transform Your Approach Today',
      '🌟 Success Stories That Inspire'
    ],
    ad_copy: [
      'Unlock Your Business Potential Today',
      'The Solution You\'ve Been Waiting For',
      'Transform Results in 30 Days',
      'Join Thousands of Success Stories',
      'Your Competitive Advantage Awaits'
    ],
    email: [
      'Your Success Story Starts Now',
      'Exclusive Insights Just for You',
      'Time-Sensitive Opportunity Inside',
      'Welcome to Your Transformation',
      'The Next Step in Your Journey'
    ]
  }

  const typeTitle = titles[type as keyof typeof titles] || titles.blog_post
  return typeTitle[Math.floor(Math.random() * typeTitle.length)]
}

function generateBodyFromPrompt(prompt: string, type: ContentPiece['type']): string {
  const bodies = {
    blog_post: 'In today\'s rapidly evolving business landscape, companies are constantly seeking innovative solutions to stay ahead of the competition. This comprehensive guide explores the latest trends and proven strategies that successful organizations are implementing to drive growth and achieve sustainable success. From digital transformation initiatives to customer-centric approaches, we\'ll dive deep into the methodologies that are reshaping industries and creating new opportunities for forward-thinking businesses.',
    social_post: 'Ready to transform your business? Our proven solutions help companies achieve remarkable results. Join thousands of satisfied clients who\'ve already made the switch and are seeing incredible growth! 💼✨ #Success #Innovation #Growth #BusinessTransformation',
    ad_copy: 'Don\'t let your competition get ahead. Our industry-leading solutions have helped over 10,000 businesses increase their efficiency by 40% in just 30 days. With our proven methodology and expert support, you\'ll see results faster than you ever thought possible. Ready to see what we can do for you? Get started today with our risk-free trial!',
    email: 'Hi there!\n\nI hope this email finds you well. I wanted to personally reach out because I believe our solution could make a significant impact on your business goals. We\'ve helped companies just like yours achieve remarkable results, and I\'d love to show you how we can do the same for you.\n\nOur approach is different - we focus on understanding your unique challenges and crafting solutions that fit your specific needs. No one-size-fits-all approaches here.\n\nWould you be interested in a brief conversation to explore how we might be able to help?\n\nBest regards,\nThe Team'
  }

  return bodies[type as keyof typeof bodies] || bodies.blog_post
}

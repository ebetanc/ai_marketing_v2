import { Calendar, Eye, Building2, Target, FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatDate, truncateText } from '../../lib/utils'

interface CompanyListItemProps {
    company: any
    onView: (company: any) => void
}

export function CompanyListItem({ company, onView }: CompanyListItemProps) {
    return (
        <li>
            <div
                className="group flex items-start gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-brand-400 hover:shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                role="button"
                tabIndex={0}
                onClick={() => onView(company)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(company) } }}
                aria-label={`View company ${company.brand_name || company.name}`}
            >
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate max-w-[24ch]" title={company.brand_name || company.name}>{company.brand_name || company.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{company.brand_tone ? truncateText(company.brand_tone, 120) : 'No brand description available'}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(company.created_at)}</span>
                        {company.target_audience && <span className="inline-flex items-center gap-1"><Target className="h-3 w-3" /> Audience</span>}
                        {(company.key_offer || company.brand_voice?.style) && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> Key Offer</span>}
                        {company.additional_information && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> Info</span>}
                    </div>
                </div>
                <div className="flex items-center">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView(company) }} aria-label={`Open company ${company.brand_name || company.name}`}>
                        <Eye className="h-4 w-4" />
                        View
                    </Button>
                </div>
            </div>
        </li>
    )
}

export default CompanyListItem

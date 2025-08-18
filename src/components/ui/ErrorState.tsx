import React from 'react'
import { Card, CardContent } from './Card'

export type ErrorStateProps = {
    icon?: React.ReactNode
    title?: string
    error?: React.ReactNode
    retry?: React.ReactNode
}

export function ErrorState({ icon, title = 'Something went wrong', error, retry }: ErrorStateProps) {
    return (
        <Card>
            <CardContent className="text-center py-12">
                {icon && <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">{icon}</div>}
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
                {error ? <div className="text-red-600 mb-4">{error}</div> : null}
                {retry}
            </CardContent>
        </Card>
    )
}

export default ErrorState

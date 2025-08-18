import React from 'react'
import { Card, CardContent } from './Card'
import { Skeleton } from './Skeleton'

type AsyncBoundaryProps = {
    loading: boolean
    error?: string | null
    fallbackItems?: number
    children: React.ReactNode
}

export function AsyncBoundary({ loading, error, fallbackItems = 3, children }: AsyncBoundaryProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: fallbackItems }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-red-600">{error}</CardContent>
            </Card>
        )
    }

    return <>{children}</>
}

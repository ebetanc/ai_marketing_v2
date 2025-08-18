import React from 'react'
import { cn } from '../../lib/utils'
import { Skeleton } from './Skeleton'

type ListSkeletonProps = {
    rows?: number
    avatar?: boolean | 'circle' | 'square'
    avatarClassName?: string
    primaryWidthClass?: string
    secondaryWidthClass?: string
    showTrailingButton?: boolean
    className?: string
}

export function ListSkeleton({
    rows = 4,
    avatar = 'square',
    avatarClassName,
    primaryWidthClass = 'w-2/3',
    secondaryWidthClass = 'w-5/6',
    showTrailingButton = false,
    className,
}: ListSkeletonProps) {
    const avatarShape = avatar === 'circle' ? 'rounded-full' : 'rounded-xl'
    return (
        <div className={cn('space-y-4', className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                        {avatar && <Skeleton className={cn('h-10 w-10', avatarShape, avatarClassName)} />}
                        <div className="space-y-2">
                            <Skeleton className={cn('h-4', primaryWidthClass)} />
                            <Skeleton className={cn('h-3', secondaryWidthClass)} />
                        </div>
                    </div>
                    {showTrailingButton && <Skeleton className="h-8 w-24 rounded-md" />}
                </div>
            ))}
        </div>
    )
}

export default ListSkeleton

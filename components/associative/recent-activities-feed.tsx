'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    Baby,
    Calendar,
    Euro,
    BarChart3,
    Package,
    ChevronRight,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type ActivityType = 'birth' | 'event' | 'money_pot' | 'poll' | 'material'

export interface RecentActivity {
    id: string
    type: ActivityType
    title: string
    subtitle?: string
    date: Date
    actionLabel?: string
    actionUrl?: string
    metadata?: {
        progress?: number // Pour les cagnottes (0-100)
        participants?: number // Pour les événements
        votes?: number // Pour les sondages
    }
}

interface RecentActivitiesFeedProps {
    activities: RecentActivity[]
}

const activityConfig: Record<ActivityType, {
    icon: React.ElementType
    color: string
    bgColor: string
    label: string
}> = {
    birth: {
        icon: Baby,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        label: 'Naissance'
    },
    event: {
        icon: Calendar,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        label: 'Événement'
    },
    money_pot: {
        icon: Euro,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        label: 'Cagnotte'
    },
    poll: {
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        label: 'Sondage'
    },
    material: {
        icon: Package,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        label: 'Matériel'
    }
}

function ActivityCard({ activity }: { activity: RecentActivity }) {
    const config = activityConfig[activity.type]
    const Icon = config.icon
    const timeAgo = formatDistanceToNow(activity.date, {
        addSuffix: true,
        locale: fr
    })

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`${config.bgColor} p-2 rounded-lg flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                        {config.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {timeAgo}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-sm mb-1">{activity.title}</h3>
                                {activity.subtitle && (
                                    <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                                )}

                                {/* Metadata */}
                                {activity.metadata && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        {activity.metadata.progress !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                <span>{activity.metadata.progress}%</span>
                                            </div>
                                        )}
                                        {activity.metadata.participants !== undefined && (
                                            <span>{activity.metadata.participants} participant{activity.metadata.participants > 1 ? 's' : ''}</span>
                                        )}
                                        {activity.metadata.votes !== undefined && (
                                            <span>{activity.metadata.votes} vote{activity.metadata.votes > 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            {activity.actionUrl && activity.actionLabel && (
                                <Link href={activity.actionUrl}>
                                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                                        {activity.actionLabel}
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function RecentActivitiesFeed({ activities }: RecentActivitiesFeedProps) {
    if (activities.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <p>Aucune nouveauté récente</p>
                    <p className="text-sm mt-1">Les nouvelles activités apparaîtront ici</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">🔔 Nouveautés</h2>
                    <p className="text-sm text-muted-foreground">
                        Restez au courant de la vie de l&apos;amicale
                    </p>
                </div>
            </div>

            <div className="grid gap-3">
                {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                ))}
            </div>
        </div>
    )
}

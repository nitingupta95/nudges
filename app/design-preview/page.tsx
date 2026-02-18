"use client";

import { useState } from "react";
import { MatchScoreRing } from "@/components/ui/match-score-ring";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { StatCard } from "@/components/ui/stat-card";
import { SparklineChart } from "@/components/ui/sparkline-chart";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { CompanyLogo } from "@/components/ui/company-logo";
import { SkillTag } from "@/components/ui/skill-tag";
import { TimelineItem } from "@/components/ui/timeline-item";
import { KanbanColumn } from "@/components/ui/kanban-column";
import { ProgressWizard } from "@/components/ui/progress-wizard";
import { SearchBar } from "@/components/ui/search-bar";
import { FilterPanel } from "@/components/ui/filter-panel";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { NotificationItem } from "@/components/ui/notification-item";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Search, UploadCloud, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DesignPreviewPage() {
    const [activeStep, setActiveStep] = useState(1);
    const [notificationOpen, setNotificationOpen] = useState(true);

    return (
        <div className="container py-10 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Design System Preview</h1>
                <p className="text-muted-foreground text-lg">
                    Verification page for Phase 1 components and styles.
                </p>
            </div>

            <Separator />

            {/* Colors & Typography */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">1. Global Styles</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-20 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-primary">Primary</div>
                    <div className="h-20 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground font-bold">Secondary</div>
                    <div className="h-20 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold">Accent</div>
                    <div className="h-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold">Muted</div>
                    <div className="h-20 rounded-lg bg-card border flex items-center justify-center text-card-foreground font-bold">Card</div>
                    <div className="h-20 rounded-lg bg-popover border flex items-center justify-center text-popover-foreground font-bold">Popover</div>
                    <div className="h-20 rounded-lg bg-destructive flex items-center justify-center text-destructive-foreground font-bold">Destructive</div>
                    <div className="h-20 rounded-lg bg-success flex items-center justify-center text-success-foreground font-bold shadow-success">Success</div>
                </div>
            </section>

            {/* Data Visualization */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">2. Data Visualization</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Match Rings</CardTitle></CardHeader>
                        <CardContent className="flex justify-around items-center">
                            <MatchScoreRing score={92} size={80} />
                            <MatchScoreRing score={65} size={60} />
                            <MatchScoreRing score={30} size={40} showLabel={false} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Trend Indicators</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span>Revenue</span>
                                <TrendIndicator value={12.5} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Churn</span>
                                <TrendIndicator value={-2.4} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Neutral</span>
                                <TrendIndicator value={0} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader><CardTitle>Funnel Chart</CardTitle></CardHeader>
                        <CardContent>
                            <FunnelChart
                                data={[
                                    { id: "1", label: "Visitors", value: 1000 },
                                    { id: "2", label: "Signups", value: 600 },
                                    { id: "3", label: "Active", value: 400 },
                                    { id: "4", label: "Paid", value: 150 },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Referrals"
                        value="1,234"
                        icon={Users}
                        trend={12}
                        trendLabel="vs last month"
                    />
                    <StatCard
                        title="Active Jobs"
                        value="42"
                        icon={Briefcase}
                        className="border-primary/20 bg-primary/5"
                        description="5 closing soon"
                    />
                    <div className="p-4 border rounded-xl bg-card">
                        <h3 className="text-sm font-medium mb-4">Activity Trend</h3>
                        <SparklineChart
                            data={[
                                { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 },
                                { value: 45 }, { value: 35 }, { value: 55 }, { value: 60 }
                            ]}
                            height={60}
                        />
                    </div>
                </div>
            </section>

            {/* Interactive Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">3. Interactive Components</h2>

                <div className="space-y-8 border p-6 rounded-xl">
                    <ProgressWizard
                        steps={[
                            { id: 1, label: "Personal Info", description: "Basic details" },
                            { id: 2, label: "Experience", description: "Work history" },
                            { id: 3, label: "Preferences", description: "Job matching" },
                            { id: 4, label: "Review", description: "Verify info" },
                        ]}
                        currentStep={activeStep}
                        onStepClick={setActiveStep}
                    />

                    <div className="flex justify-between items-center gap-4">
                        <SearchBar placeholder="Search candidates..." />
                        <FilterPanel activeCount={2}>
                            <div className="p-4 space-y-4">
                                <h4 className="font-medium">Filter Options</h4>
                                <div className="h-20 bg-muted/30 rounded-md"></div>
                                <div className="h-20 bg-muted/30 rounded-md"></div>
                            </div>
                        </FilterPanel>
                    </div>
                </div>
            </section>

            {/* Lists & Cards */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">4. Lists & Layouts</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Kanban */}
                    <KanbanColumn title="To Do" count={3} color="var(--primary)">
                        <div className="p-3 bg-background rounded-lg shadow-sm border text-sm">Task 1</div>
                        <div className="p-3 bg-background rounded-lg shadow-sm border text-sm">Task 2</div>
                        <div className="p-3 bg-background rounded-lg shadow-sm border text-sm">Task 3</div>
                    </KanbanColumn>

                    {/* Timeline */}
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold mb-4">Activity Feed</h3>
                        <TimelineItem
                            title="New Referral"
                            timestamp="2 hours ago"
                            description="John Doe referred Jane Smith for Senior Engineer"
                            icon={Users}
                            status="success"
                        />
                        <TimelineItem
                            title="Interview Scheduled"
                            timestamp="5 hours ago"
                            description="Interview with Candidate A confirmed"
                            icon={CheckCircle}
                            status="default"
                            isLast
                        />
                    </div>

                    {/* Gamification */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Achievements</h3>
                        <div className="flex gap-4">
                            <AchievementBadge title="First Referral" variant="bronze" size="sm" />
                            <AchievementBadge title="Super Connector" variant="gold" size="sm" />
                            <AchievementBadge title="Legendary" variant="platinum" size="sm" unlocked={false} />
                        </div>

                        <div className="pt-4">
                            <h3 className="font-semibold mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                <SkillTag name="React" level="expert" showLevel />
                                <SkillTag name="TypeScript" level="intermediate" showLevel />
                                <SkillTag name="Node.js" />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <CompanyLogo name="Google" size="lg" />
                            <CompanyLogo name="Microsoft" size="lg" />
                            <CompanyLogo name="Amazon" size="lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Notifications & Empty States */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">5. Notifications & Empty States</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {notificationOpen && (
                        <NotificationItem
                            title="Application Update"
                            message="Your referral for Senior Designer has moved to the Interview stage."
                            type="success"
                            timestamp="Just now"
                            actions={[
                                { label: "View Details", onClick: () => { } },
                                { label: "Dismiss", onClick: () => setNotificationOpen(false), variant: "ghost" }
                            ]}
                        />
                    )}

                    <EmptyState
                        title="No jobs found"
                        description="Try adjusting your search filters or check back later."
                        icon={Search}
                        action={{ label: "Clear Filters", onClick: () => { } }}
                        className="h-full"
                    />
                </div>
            </section>
        </div>
    );
}

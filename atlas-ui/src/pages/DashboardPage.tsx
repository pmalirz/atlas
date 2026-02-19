

export function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="atlas-header border-0 bg-transparent px-0">
                <h1 className="atlas-header-title text-3xl">Dashboard</h1>
                <p className="atlas-header-subtitle">
                    Welcome to App Atlas. Select an entity from the sidebar to get started.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="atlas-card">
                    <div className="atlas-card-header">
                        <h3 className="atlas-card-title">Welcome</h3>
                    </div>
                    <p className="atlas-card-description">Get started with your data</p>
                    <div className="atlas-card-content mt-2">
                        <p className="text-sm text-muted-foreground">
                            Explore your entities using the navigation on the left.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


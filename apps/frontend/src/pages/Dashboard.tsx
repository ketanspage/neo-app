import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function Dashboard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Dashboard</CardTitle>
                <CardDescription>Welcome to your personal dashboard</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="font-medium">Full name:</span>
                        <span>John Doe</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Email address:</span>
                        <span>johndoe@example.com</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default Dashboard


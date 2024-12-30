import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Template {
    id: number;
    name: string;
    description: string | null;
    bucketUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

function TemplatesList() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/templates/listTemplates')
            if (!response.ok) {
                throw new Error('Failed to fetch templates')
            }
            const data = await response.json()
            setTemplates(data.templates)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching templates')
        } finally {
            setIsLoading(false)
        }
    }

    if (error) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Templates</h1>
                <Button asChild>
                    <Link to="/templates/new">Create New Template</Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6">
                                <CardHeader>
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-4 w-full mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-32 mt-4" />
                                </CardContent>
                            </div>
                            <div className="flex-1 bg-muted p-6 rounded-r-lg">
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </Card>
                    ))
                ) : templates.length === 0 ? (
                    <Card className="p-6 text-center">
                        <CardDescription>No templates found. Create your first template to get started.</CardDescription>
                    </Card>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6">
                                <CardHeader>
                                    <CardTitle>{template.name}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild className="mt-4">
                                        <Link to={`/templates/${template.id}`}>View Template</Link>
                                    </Button>
                                </CardContent>
                            </div>
                            <div className="flex-1 bg-muted p-6 rounded-r-lg">
                                {template.bucketUrl && (
                                    <pre className="text-sm overflow-x-auto">
                                        <code>{template.bucketUrl}</code>
                                    </pre>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

export default TemplatesList
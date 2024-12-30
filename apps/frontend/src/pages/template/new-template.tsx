import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CodeContainer from '../assignments/code-container'

function NewTemplate() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [files] = useState<{ [key: string]: string }>({
        'src/index.js': '// Your code here',
        'public/index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Your App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>\n',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            console.log('Sending request with data:', {
                name,
                description,
                files,
            })

            const response = await fetch('http://localhost:3000/api/templates/createTemplate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    files,
                }),
            })

            console.log('Response status:', response.status)
            
            // Get the raw text first
            const responseText = await response.text()
            console.log('Raw response:', responseText)

            // Only try to parse as JSON if we have content
            let data
            if (responseText) {
                try {
                    data = JSON.parse(responseText)
                } catch (parseError) {
                    console.error('JSON parse error:', parseError)
                    throw new Error('Invalid response format from server')
                }
            } else {
                throw new Error('Empty response from server')
            }

            if (!response.ok) {
                throw new Error(data?.error || `Server error: ${response.status}`)
            }

            console.log('Template created successfully:', data)
            navigate('/templates')
        } catch (err) {
            console.error('Error details:', err)
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Add New Template</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 mb-6">
                            <div>
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <Label>Template Code</Label>
                            <CodeContainer
                                project={{
                                    id: 'new_template',
                                    title: name || 'New Template',
                                    description: description || 'New template description',
                                    files,
                                    dependencies: {},
                                }}
                            />
                        </div>
                        <CardFooter className="flex justify-end">
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Template'}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default NewTemplate
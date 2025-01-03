import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import sdk from '@stackblitz/sdk'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const templates = {
    react: {
        name: 'React Template',
        type: 'node',
        files: {
            'src/App.tsx': `import React from 'react';

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello React!</h1>
    </div>
  );
}`,
            'src/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);`,
            'public/index.html': `<!DOCTYPE html>
<html>
  <head>
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
'package.json': `
{
  "name": "waptw9nq--run",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "react": "18.1.0",
    "react-dom": "18.1.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "react-scripts": "latest"
  }
}`
        },
        defaultFile: 'src/App.tsx'
    },
    vanilla: {
        name: 'Vanilla JS Template',
        type: 'node',
        files: {
            'index.js': `// Your JavaScript code here
document.getElementById('app').innerHTML = \`
  <h1>Hello Vanilla JS!</h1>
\`;`,
            'index.html': `<!DOCTYPE html>
<html>
  <head>
    <title>Vanilla JS App</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>`,
            'styles.css': `/* Your styles here */
body {
  font-family: sans-serif;
  padding: 20px;
}`
        },
        defaultFile: 'index.js'
    },
    
}

type TemplateType = keyof typeof templates

function NewTemplate() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('react')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)

    const destroyEditor = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }
        editorRef.current = null
    }

    const initializeEditor = async () => {
        if (!containerRef.current) return

        try {
            setIsLoading(true)
            setError(null)

            // Destroy existing editor instance
            destroyEditor()

            const template = templates[selectedTemplate]
            
            // Create a new div element for the editor
            const editorElement = document.createElement('div')
            containerRef.current.appendChild(editorElement)

            // Initialize new editor
            const vm = await sdk.embedProject(
                editorElement,
                {
                    files: template.files,
                    title: name || 'New Template',
                    description: description || 'New template description',
                    template: template.type as any
                },
                {
                    openFile: template.defaultFile,
                    height: 600,
                    width: '100%',
                }
            )

            editorRef.current = vm
        } catch (err) {
            console.error('Error embedding Stackblitz:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        initializeEditor()

        // Cleanup function
        return () => {
            destroyEditor()
        }
    }, [selectedTemplate]) // Only reinitialize when template changes

    const handleTemplateChange = (value: TemplateType) => {
        setSelectedTemplate(value)
    }

    const handleSaveFiles = async () => {
        if (!editorRef.current) {
            throw new Error('Editor not initialized')
        }

        try {
            const updatedFiles = await editorRef.current.getFsSnapshot()
            if (!updatedFiles) {
                throw new Error('Failed to retrieve code: No files found')
            }
            return updatedFiles
        } catch (error) {
            console.error('Error getting files:', error)
            throw new Error('Failed to retrieve code')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const currentFiles = await handleSaveFiles()

            const response = await fetch('http://localhost:3000/api/templates/createTemplate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    files: currentFiles,
                }),
            })
            
            const responseText = await response.text()
            let data

            if (responseText) {
                try {
                    data = JSON.parse(responseText)
                } catch (parseError) {
                    throw new Error('Invalid response format from server')
                }
            } else {
                throw new Error('Empty response from server')
            }

            if (!response.ok) {
                throw new Error(data?.error || `Server error: ${response.status}`)
            }

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
                            <div>
                                <Label htmlFor="template-type">Template Type</Label>
                                <Select
                                    value={selectedTemplate}
                                    onValueChange={(value: TemplateType) => handleTemplateChange(value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a template type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(templates).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mb-6">
                            <Label>Template Code</Label>
                            <div
                                ref={containerRef}
                                className="mt-2 border rounded-md min-h-[600px]"
                            />
                        </div>
                        <CardFooter className="flex justify-end space-x-2 px-0">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => navigate('/templates')}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
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
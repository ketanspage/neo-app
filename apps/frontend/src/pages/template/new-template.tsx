import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { templates } from '@/data/templates'
import CodeContainer from '../assignments/code-container'

function NewTemplate() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [files, setFiles] = useState<{ [key: string]: string }>({
        'index.js': '// Your code here'
    })
    const [dependencies, setDependencies] = useState<{ [key: string]: string }>({})
    const navigate = useNavigate()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newTemplate = {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            title: name,
            description,
            files,
            dependencies,
        }
        templates.push(newTemplate)
        navigate('/templates')
    }

    const updateFiles = (newFiles: { [key: string]: string }) => {
        setFiles(newFiles)
    }

    return (
        <div className="p-6">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Add New Template</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 mb-6">
                            <div>
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
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
                                    dependencies,
                                }}
                            // onSave={updateFiles}
                            />
                        </div>
                        {/* <CardFooter className="flex justify-end">
                            <Button type="submit">Save Template</Button>
                        </CardFooter> */}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default NewTemplate


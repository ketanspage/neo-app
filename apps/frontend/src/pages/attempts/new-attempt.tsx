import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm, SubmitHandler } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Template {
    id: number;
    name: string;
    description: string | null;
    bucketUrl: string;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    title: string;
    description: string;
    templateId: string;
}

export default function NewAssignmentForm() {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>()

    // Fetch templates when component mounts
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/templates/listTemplates')
                const data = await response.json()
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch templates')
                }
                
                setTemplates(data.templates)
            } catch (err) {
                setError('Failed to load templates')
                console.error('Error loading templates:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchTemplates()
    }, [])

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setError('')

        try {
            // Find the selected template to get its files
            const selectedTemplate = templates.find(t => t.id === parseInt(data.templateId))
            
            if (!selectedTemplate) {
                throw new Error('Selected template not found')
            }

            const response = await fetch('http://localhost:3000/api/assignments/createAssignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    templateId: parseInt(data.templateId),
                    files: {} // You might want to get this from the template or allow user input
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create assignment')
            }

            // Redirect to assignments list after successful creation
            navigate('/assignments')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create assignment')
        }
    }

    return (
        <div className="max-w-5xl">
            <div className='mb-10'>
                <h1 className='text-2xl font-semibold'>Start New Attempt</h1>
                <p>Add a new coding challenge to improve your skills</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Enter assignment title"
                            {...register("title", { required: "Title is required" })}
                        />
                        {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the assignment"
                            {...register("description", { required: "Description is required" })}
                        />
                        {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="template">Template</Label>
                        <Select 
                            onValueChange={(value) => setValue('templateId', value)}
                            defaultValue=""
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((template) => (
                                    <SelectItem 
                                        key={template.id} 
                                        value={template.id.toString()}
                                    >
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.templateId && <span className="text-red-500 text-sm">{errors.templateId.message}</span>}
                    </div>
                </div>

                <div className="flex justify-between mt-10">
                    <Button type="button" variant="outline" onClick={() => navigate('/assignments')}>
                        Cancel
                    </Button>
                    <Button type="submit">Create Assignment</Button>
                </div>
            </form>

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
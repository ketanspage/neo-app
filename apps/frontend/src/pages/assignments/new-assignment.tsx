import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm, SubmitHandler } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import sdk from '@stackblitz/sdk'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Template {
    id: number;
    name: string;
    description: string | null;
    difficulty:string;
    bucketUrl: string;
    files: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    title: string;
    description: string;
    templateId: string;
    difficulty: string;
}

interface BucketData {
    files: Record<string, string>;
    loading: boolean;
    error: string | null;
}

export default function NewAssignmentForm() {
    const DIFFICULTY_LEVELS = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ] as const;
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
        defaultValues: {
            difficulty: 'beginner'
        }
    });
    const handleDifficultyChange = (value: string) => {
        setValue('difficulty', value)
    }
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)
    
    const [bucketData, setBucketData] = useState<BucketData>({
        files: {},
        loading: false,
        error: null
    });


    const destroyEditor = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }
        editorRef.current = null
    }

    const initializeEditor = async (files: Record<string, string>) => {
        if (!containerRef.current) return

        try {
            destroyEditor()

            const editorElement = document.createElement('div')
            containerRef.current.appendChild(editorElement)

            const vm = await sdk.embedProject(
                editorElement,
                {
                    files: files,
                    title: selectedTemplate?.name || 'Template',
                    description: selectedTemplate?.description || '',
                    template: 'node'
                },
                {
                    height: 600,
                    width: '100%',
                }
            )

            editorRef.current = vm
        } catch (err) {
            console.error('Error embedding Stackblitz:', err)
            setBucketData(prev => ({
                ...prev,
                error: 'Failed to initialize code editor'
            }))
        }
    }

    // Initialize editor with files
    const initializeBucketData = async (files: Record<string, string>) => {
        try {
            setBucketData(prev => ({ ...prev, loading: true, error: null }))
            
            setBucketData({
                files,
                loading: false,
                error: null
            })

            // Initialize Stackblitz editor with the files
            await initializeEditor(files)
        } catch (err) {
            console.error('Error initializing editor:', err)
            setBucketData(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to initialize editor'
            }))
        }
    }

    // Fetch template details
    const fetchTemplateDetails = async (templateId: string) => {
        try {
            setLoading(true)
            setError('')
            
            const response = await fetch(`http://localhost:3000/api/templates/getTemplate/${templateId}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch template details')
            }
            
            const templateData = data.template[0]
            setSelectedTemplate(templateData)

            // Initialize editor with template files
            if (templateData.files) {
                await initializeBucketData(templateData.files)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch template details')
        } finally {
            setLoading(false)
        }
    }

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

        return () => {
            destroyEditor()
        }
    }, [])

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

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setError('')

        try {
            if (!selectedTemplate) {
                throw new Error('No template selected')
            }

            const currentFiles = await handleSaveFiles()

            const response = await fetch('http://localhost:3000/api/assignments/createAssignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    templateId: parseInt(data.templateId),
                    difficulty: data.difficulty,
                    files: currentFiles
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create assignment')
            }

            navigate('/assignments')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create assignment')
        }
    }

    const handleTemplateChange = async (value: string) => {
        setValue('templateId', value)
        await fetchTemplateDetails(value)
    }

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold">Create New Assignment</h1>
                <p>Add a new coding challenge to improve your skills</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select 
                            onValueChange={handleDifficultyChange}
                            defaultValue="beginner"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIFFICULTY_LEVELS.map(({ value, label }) => (
                                    <SelectItem 
                                        key={value} 
                                        value={value}
                                    >
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.difficulty && <span className="text-red-500 text-sm">{errors.difficulty.message}</span>}
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="template">Template</Label>
                        <Select 
                            onValueChange={handleTemplateChange}
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

                {selectedTemplate && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Template Code</h2>
                        {bucketData.loading ? (
                            <Skeleton className="h-[600px] w-full" />
                        ) : bucketData.error ? (
                            <Alert variant="destructive">
                                <AlertDescription>{bucketData.error}</AlertDescription>
                            </Alert>
                        ) : (
                            <div
                                ref={containerRef}
                                className="border rounded-md min-h-[600px]"
                            />
                        )}
                    </div>
                )}

                <div className="flex justify-between mt-10">
                    <Button type="button" variant="outline" onClick={() => navigate('/assignments')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !selectedTemplate}>
                        Create Assignment
                    </Button>
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
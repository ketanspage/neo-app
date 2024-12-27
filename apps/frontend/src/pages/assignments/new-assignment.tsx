import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, SubmitHandler } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FormData {
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    status: 'Not Started' | 'In Progress' | 'Completed';
}

export default function NewAssignmentForm() {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>()

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setError('')

        try {
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('New Assignment:', data)

            // Redirect to assignments list after successful creation
            navigate('/assignments')
        } catch (err) {
            setError('Failed to create assignment. Please try again.')
        }
    }

    return (
        <div className="max-w-5xl">
            <div className='mb-10'>
                <h1 className='text-2xl font-semibold'>Create New Assignment</h1>
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
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select defaultValue="">
                            <SelectTrigger id="difficulty">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.difficulty && <span className="text-red-500 text-sm">{errors.difficulty.message}</span>}
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select initial status" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <span className="text-red-500 text-sm">{errors.status.message}</span>}
                    </div>
                </div>
            </form>

            <div className="flex justify-between mt-10">
                <Button variant="outline" onClick={() => navigate('/assignments')}>Cancel</Button>
                <Button onClick={handleSubmit(onSubmit)}>Create Assignment</Button>
            </div>

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


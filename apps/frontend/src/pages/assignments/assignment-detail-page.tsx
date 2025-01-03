import { useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    difficulty: string;
    templateId: number | null;
    bucketUrl: string;
    files: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

interface BucketData {
    files: Record<string, string>;
    loading: boolean;
    error: string | null;
}

const DIFFICULTY_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
] as const;

function AssignmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    
    const [bucketData, setBucketData] = useState<BucketData>({
        files: {},
        loading: false,
        error: null
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: '',
        templateId: '',
        files: {}
    });

    const destroyEditor = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        editorRef.current = null;
    };

    const initializeEditor = async (files: Record<string, string>, isEditMode: boolean = false) => {
        if (!containerRef.current) return;
    
        try {
            destroyEditor();
    
            const editorElement = document.createElement('div');
            containerRef.current.appendChild(editorElement);
    
            console.log('Embedding project with files:', files);
    
            if (!Object.keys(files).length) {
                throw new Error('No files available to display');
            }
    
            const vm = await sdk.embedProject(
                editorElement,
                {
                    files: files,
                    title: assignment?.title || 'Assignment',
                    description: assignment?.description || '',
                    template: 'node'
                },
                {
                    height: 600,
                    width: '100%',
                    clickToLoad: false,
                    openFile: Object.keys(files)[0],
                    terminalHeight: 50,
                    //readOnly: !isEditMode
                }
            );
    
            console.log('Editor VM created:', vm);
            editorRef.current = vm;
        } catch (err) {
            console.error('Editor initialization error:', err);
            
        }
    };

    const initializeBucketData = async (files: Record<string, string>, isEditMode: boolean = false) => {
        try {
            setBucketData(prev => ({ ...prev, loading: true, error: null }));
            
            setBucketData({
                files,
                loading: false,
                error: null
            });

            await initializeEditor(files, isEditMode);
        } catch (err) {
            console.error('Error initializing editor:', err);
            setBucketData(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to initialize editor'
            }));
        }
    };

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`http://localhost:3000/api/assignments/getAssignment/${id}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch assignment');
            }
            
            // Changed from data.templates[0] to data.assignments[0]
            const assignmentData = data.assignments[0];
            console.log('Assignment Data:', assignmentData);
    
            if (!assignmentData) {
                throw new Error('Assignment data not found');
            }
    
            setAssignment(assignmentData);
            setFormData({
                title: assignmentData.title,
                description: assignmentData.description || '',
                difficulty: assignmentData.difficulty || 'beginner',
                templateId: assignmentData.templateId?.toString() || '',
                files: assignmentData.files || {}
            });
    
            if (assignmentData.files) {
                console.log('Initializing editor with files:', assignmentData.files);
                await initializeBucketData(assignmentData.files, isEditing);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAssignment();
        }

        return () => {
            destroyEditor();
        };
    }, [id]);

    useEffect(() => {
        if (assignment?.files && Object.keys(assignment.files).length > 0) {
            console.log('Reinitializing editor with files:', assignment.files);
            initializeBucketData(assignment.files, isEditing);
        }
    }, [isEditing, assignment?.files]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDifficultyChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            difficulty: value
        }));
    };

    const handleSaveFiles = async () => {
        if (!editorRef.current) {
            throw new Error('Editor not initialized');
        }

        try {
            const updatedFiles = await editorRef.current.getFsSnapshot();
            if (!updatedFiles) {
                throw new Error('Failed to retrieve code: No files found');
            }
            return updatedFiles;
        } catch (error) {
            console.error('Error getting files:', error);
            throw new Error('Failed to retrieve code');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setUpdateSuccess(false);

            const currentFiles = await handleSaveFiles();

            const response = await fetch(`http://localhost:3000/api/assignments/editAssignment/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    templateId: formData.templateId ? parseInt(formData.templateId) : null,
                    files: currentFiles
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update assignment');
            }

            setUpdateSuccess(true);
            await fetchAssignment();
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update assignment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!assignment) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertDescription>Assignment not found</AlertDescription>
            </Alert>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 text-green-800'
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800'
            case 'advanced':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{assignment.title}</h1>
                    <Badge className={getDifficultyColor(assignment.difficulty)}>
                        {assignment.difficulty}
                    </Badge>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        Edit Assignment
                    </Button>
                )}
            </div>

            {updateSuccess && !isEditing && (
                <Alert className="bg-green-50 text-green-800 border-green-300">
                    <AlertDescription>Assignment updated successfully!</AlertDescription>
                </Alert>
            )}

            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Title</label>
                        <Input
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Assignment title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description</label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Assignment description"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Difficulty Level</label>
                        <Select 
                            onValueChange={handleDifficultyChange}
                            defaultValue={formData.difficulty}
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
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Template ID</label>
                        <Input
                            name="templateId"
                            type="number"
                            value={formData.templateId}
                            onChange={handleInputChange}
                            placeholder="Template ID (optional)"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Assignment Code</label>
                        <div
                            ref={containerRef}
                            className="border rounded-md min-h-[600px]"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                                if (assignment) {
                                    setFormData({
                                        title: assignment.title,
                                        description: assignment.description || '',
                                        difficulty: assignment.difficulty || 'beginner',
                                        templateId: assignment.templateId?.toString() || '',
                                        files: assignment.files
                                    });
                                }
                                setIsEditing(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <>
                    {assignment.description && (
                        <p className="text-gray-600">{assignment.description}</p>
                    )}
                    
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Assignment Details</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Created: {new Date(assignment.createdAt).toLocaleString()}</p>
                            <p>Last Updated: {new Date(assignment.updatedAt).toLocaleString()}</p>
                            {assignment.templateId && (
                                <p>Template ID: {assignment.templateId}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Assignment Code</h2>
                        {bucketData.loading ? (
    <Skeleton className="h-[600px] w-full" />
) : bucketData.error ? (
    <Alert variant="destructive">
        <AlertDescription>
            {bucketData.error}
            <br />
            <pre className="mt-2 text-xs">
                {JSON.stringify(bucketData.files, null, 2)}
            </pre>
        </AlertDescription>
    </Alert>
) : (
    <div className="relative">
        <div
            ref={containerRef}
            className="border rounded-md min-h-[600px] w-full"
            style={{ height: '600px' }}
        />
        {!Object.keys(bucketData.files).length && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                No files available
            </div>
        )}
    </div>
)}
                    </div>
                </>
            )}
        </div>
    );
}

export default AssignmentDetailPage;
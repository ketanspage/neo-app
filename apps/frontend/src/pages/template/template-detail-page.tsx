import { useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { stat } from 'fs';
interface Template {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'inactive' | 'archived';  // Add this
    bucketUrl: string;
    files: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

// Add status levels constant
const STATUS_LEVELS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' }
] as const;

interface BucketData {
    files: Record<string, string>;
    loading: boolean;
    error: string | null;
}

function TemplateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [template, setTemplate] = useState<Template | null>(null);
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
        name: '',
        description: '',
        status: '',
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

            const vm = await sdk.embedProject(
                editorElement,
                {
                    files: files,
                    title: template?.name || 'Template',
                    description: template?.description || '',
                    template: 'node'
                },
                {
                    height: 600,
                    width: '100%',
                    clickToLoad: false,
                    openFile: 'index.js', // Default file to open
                    terminalHeight: 50,
                    // readOnly: !isEditMode // Make editor readonly when not in edit mode
                }
            );

            editorRef.current = vm;
        } catch (err) {
            console.error('Error embedding Stackblitz:', err);
            setBucketData(prev => ({
                ...prev,
                error: 'Failed to initialize code editor'
            }));
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

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`http://localhost:3000/api/templates/getTemplate/${id}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch template');
            }
            
            const templateData = data.template[0];
            console.log('Received template data:', templateData); // Debug log
            
            setTemplate(templateData);
            const initialFormData = {
                name: templateData.name || '',
                description: templateData.description || '',
                status: templateData.status || 'active',    
                files: templateData.files || {}
            };
            console.log('Setting initial form data:', initialFormData); // Debug log
            setFormData(initialFormData);

            // Initialize editor with template files and edit mode status
            if (templateData.files) {
                await initializeBucketData(templateData.files, isEditing);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchTemplate();
        }

        return () => {
            destroyEditor();
        };
    }, [id]);

    // Re-initialize editor when editing mode changes
    useEffect(() => {
        if (template?.files) {
            initializeBucketData(template.files, isEditing);
        }
    }, [isEditing]);
    const handleStatusChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            status: value
        }));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        console.log(`Updating ${name} to:`, value); // Debug log
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            console.log('New form data:', newData); // Debug log
            return newData;
        });
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
            
            // Log the files to verify content
            console.log('Updated files:', updatedFiles);
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

            console.log('Form data before submit:', formData); // Debug log
            const currentFiles = await handleSaveFiles();

            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                status: formData.status,
                files: currentFiles
            };

            console.log('Sending update data:', updateData); // Debug log

            const response = await fetch(`http://localhost:3000/api/templates/editTemplate/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update template');
            }

            setUpdateSuccess(true);
            await fetchTemplate();
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update template');
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

    if (!template) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertDescription>Template not found</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{template.name}</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        Edit Template
                    </Button>
                )}
            </div>

            {updateSuccess && !isEditing && (
                <Alert className="bg-green-50 text-green-800 border-green-300">
                    <AlertDescription>Template updated successfully!</AlertDescription>
                </Alert>
            )}

            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Name</label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Template name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description</label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Template description"
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
            <label className="block text-sm font-medium">Change Status</label>
            <Select 
                onValueChange={handleStatusChange}
                defaultValue={formData.status}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_LEVELS.map(({ value, label }) => (
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
                        <label className="block text-sm font-medium">Template Code</label>
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
                                if (template) {
                                    setFormData({
                                        name: template.name,
                                        description: template.description || '',
                                        status: template.status,
                                        files: template.files
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
                    {template.description && (
                        <p className="text-gray-600">{template.description}</p>
                    )}
                    <p>Status: <Badge variant={template.status === 'active' ? 'default' : 
                    template.status === 'inactive' ? 'secondary' : 'outline'}>
                    {template.status}
                </Badge></p>
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Template Details</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Created: {new Date(template.createdAt).toLocaleString()}</p>
                            <p>Last Updated: {new Date(template.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4">
           
        </div>


                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Template Code</h2>
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
                </>
            )}
        </div>
    );
}

export default TemplateDetailPage;
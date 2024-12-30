import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Template {
    id: number;
    name: string;
    description: string | null;
    bucketUrl: string;
    createdAt: string;
    updatedAt: string;
}

function TemplateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        bucketUrl: ''
    });

    // Fetch template metadata
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
            setTemplate(templateData);
            setFormData({
                name: templateData.name,
                description: templateData.description || '',
                bucketUrl: templateData.bucketUrl || ''
            });
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
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setUpdateSuccess(false);

            const response = await fetch(`http://localhost:3000/api/templates/editTemplate/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    bucketUrl: formData.bucketUrl
                }),
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
                {!isEditing ? (
                    <>
                        <h1 className="text-2xl font-bold">{template.name}</h1>
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Template
                        </Button>
                    </>
                ) : (
                    <h1 className="text-2xl font-bold">Edit Template</h1>
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
                        <label className="block text-sm font-medium">Bucket URL</label>
                        <Input
                            name="bucketUrl"
                            value={formData.bucketUrl}
                            onChange={handleInputChange}
                            placeholder="templates/filename.json"
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
                                setIsEditing(false);
                                setFormData({
                                    name: template.name,
                                    description: template.description || '',
                                    bucketUrl: `http://127.0.0.1:9090/browser/${template.bucketUrl}` || ''
                                });
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
                    
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Template Details</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Created: {new Date(template.createdAt).toLocaleString()}</p>
                            <p>Last Updated: {new Date(template.updatedAt).toLocaleString()}</p>
                            <p>Bucket URL: {template.bucketUrl}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TemplateDetailPage;
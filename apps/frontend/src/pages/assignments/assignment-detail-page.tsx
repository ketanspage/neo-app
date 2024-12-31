import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    templateId: number | null;
    bucketUrl: string;
    createdAt: string;
    updatedAt: string;
}

function AssignmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        templateId: '',
        files: []
    });

    // Fetch assignment metadata
    const fetchAssignment = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`http://localhost:3000/api/assignments/getAssignment/${id}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch assignment');
            }
            
            const assignmentData = data.templates[0];
            setAssignment(assignmentData);
            setFormData({
                title: assignmentData.title,
                description: assignmentData.description || '',
                templateId: assignmentData.templateId?.toString() || '',
                files: []
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAssignment();
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

            const response = await fetch(`http://localhost:3000/api/assignments/editAssignment/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    templateId: formData.templateId ? parseInt(formData.templateId) : null,
                    files: formData.files
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

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                {!isEditing ? (
                    <>
                        <h1 className="text-2xl font-bold">{assignment.title}</h1>
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Assignment
                        </Button>
                    </>
                ) : (
                    <h1 className="text-2xl font-bold">Edit Assignment</h1>
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
                        <label className="block text-sm font-medium">Template ID</label>
                        <Input
                            name="templateId"
                            type="number"
                            value={formData.templateId}
                            onChange={handleInputChange}
                            placeholder="Template ID (optional)"
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
                                    title: assignment.title,
                                    description: assignment.description || '',
                                    templateId: assignment.templateId?.toString() || '',
                                    files: []
                                });
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
                            <p>Bucket URL: {assignment.bucketUrl}</p>
                            {assignment.templateId && (
                                <p>Template ID: {assignment.templateId}</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AssignmentDetailPage;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import sdk from '@stackblitz/sdk';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    difficulty: string;
    feedback: string | null;
    files: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

function NewAttemptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    const destroyEditor = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        editorRef.current = null;
    };

    const initializeEditor = async (files: Record<string, string>) => {
        if (!containerRef.current) return;

        try {
            destroyEditor();

            const editorElement = document.createElement('div');
            containerRef.current.appendChild(editorElement);

            if (!Object.keys(files).length) {
                throw new Error('No files available to display');
            }

            const vm = await sdk.embedProject(
                editorElement,
                {
                    files: files,
                    title: assignment?.title || 'Assignment Attempt',
                    description: assignment?.description || '',
                    template: 'node'
                },
                {
                    height: 600,
                    width: '100%',
                    clickToLoad: false,
                    openFile: Object.keys(files)[0],
                    terminalHeight: 50
                }
            );

            editorRef.current = vm;
        } catch (err) {
            console.error('Editor initialization error:', err);
            setError('Failed to initialize code editor');
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
            
            const assignmentData = data.assignments[0];
            
            if (!assignmentData) {
                throw new Error('Assignment not found');
            }
    
            setAssignment(assignmentData);
    
            if (assignmentData.files) {
                await initializeEditor(assignmentData.files);
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

    const handleSubmitAttempt = async () => {
        if (!editorRef.current || !assignment) {
            setError('Editor not initialized');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Get current files from editor
            const files = await editorRef.current.getFsSnapshot();
            if (!files) {
                throw new Error('No files to submit');
            }

            // Create the attempt
            const response = await fetch('http://localhost:3000/api/attempts/createAttempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files,
                    assignmentId: assignment.id,
                    userId: 1, // You might want to get this from authentication context
                    status: 'Submitted',
                    score: null,
                    feedback
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit attempt');
            }

            // Navigate to attempts list
            navigate('/attempts');
        } catch (err) {
            console.error('Submit error:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit attempt');
        } finally {
            setSubmitting(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 text-green-800';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-[600px] w-full" />
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
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <CardTitle>{assignment.title}</CardTitle>
                            <Badge className={getDifficultyColor(assignment.difficulty)}>
                                {assignment.difficulty}
                            </Badge>
                        </div>
                        <Button 
                            onClick={handleSubmitAttempt}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Attempt'}
                        </Button>
                    </div>
                    {assignment.description && (
                        <CardDescription>{assignment.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                          <div>
                            <h2 className="text-lg font-semibold mb-2">Your Solution</h2>
                            <div
                                ref={containerRef}
                                className="border rounded-md min-h-[600px]"
                            />
                        </div>
                        <div>
                <h2 className="text-lg font-semibold mb-2">Feedback</h2>
                <Textarea onChange={(e) => setFeedback(e.target.value)} value={feedback}></Textarea>
                </div>
               
                    </div>
                </CardContent>
                
            </Card>
        </div>
    );
}

export default NewAttemptPage;
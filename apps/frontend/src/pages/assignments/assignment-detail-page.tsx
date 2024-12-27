import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import CodeContainer from './code-container'
import { assignmentProjects } from '@/data/assignmentProjects'

interface Assignment {
    id: string;
    title: string;
    description: string;
    testCases: string;
}

function AssignmentDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [project, setProject] = useState<typeof assignmentProjects[0] | null>(null)
    const [output, setOutput] = useState('')

    useEffect(() => {
        const fetchAssignment = async () => {
            // In a real application, this would be an API call
            const response = await new Promise<Assignment>((resolve) =>
                setTimeout(() => resolve({
                    id: '1',
                    title: 'React State Management with Hooks',
                    description: 'Create a counter component using the useState hook. The component should display the current count and have buttons to increment and decrement the count.',
                    testCases: `describe('Counter', () => {
  it('should render the initial count', () => {
    // Test implementation
  });

  it('should increment the count when the increment button is clicked', () => {
    // Test implementation
  });

  it('should decrement the count when the decrement button is clicked', () => {
    // Test implementation
  });
});`
                }), 500)
            );
            setAssignment(response);

            // Fetch the project information
            const projectInfo = assignmentProjects.find(p => p.id === id);
            if (projectInfo) {
                setProject(projectInfo);
            }
        };

        fetchAssignment();
    }, [id]);

    const handleRunTests = () => {
        // In a real application, this would send the code to a backend for testing
        setOutput('Running tests...\n\nTests completed!\n\nResults:\n2/3 tests passed.');
    };

    if (!assignment || !project) {
        return <div>Loading...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>{assignment.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="code" className="w-full">
                    <TabsList>
                        <TabsTrigger value="code">Code</TabsTrigger>
                        <TabsTrigger value="tests">Tests</TabsTrigger>
                    </TabsList>
                    <TabsContent value="code">
                        <CodeContainer project={project} />
                    </TabsContent>
                    <TabsContent value="tests">
                        <Textarea
                            value={assignment.testCases}
                            readOnly
                            className="min-h-[400px] font-mono"
                        />
                    </TabsContent>
                </Tabs>
                {/* <div className="flex justify-between mt-4">
          <Button onClick={handleRunTests}>Run Tests</Button>
        </div>
        <Textarea
          value={output}
          readOnly
          className="mt-4 min-h-[100px] font-mono"
          placeholder="Test output will appear here..."
        /> */}
            </CardContent>
        </Card>
    )
}

export default AssignmentDetailPage


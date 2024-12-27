import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Attempt {
  id: string;
  submittedAt: string;
  status: 'Pending' | 'Passed' | 'Failed';
  score: number;
}

function AssignmentAttempts() {
  const { id } = useParams<{ id: string }>()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [assignment, setAssignment] = useState<{ title: string } | null>(null)

  useEffect(() => {
    // Simulating API calls to fetch assignment details and attempts
    const fetchAssignmentAndAttempts = async () => {
      // In a real application, these would be API calls
      const assignmentResponse = await new Promise<{ title: string }>((resolve) =>
        setTimeout(() => resolve({ title: 'Introduction to Python' }), 500)
      );
      setAssignment(assignmentResponse);

      const attemptsResponse = await new Promise<Attempt[]>((resolve) =>
        setTimeout(() => resolve([
          { id: '1', submittedAt: '2023-06-25 14:30', status: 'Passed', score: 95 },
          { id: '2', submittedAt: '2023-06-24 10:15', status: 'Failed', score: 65 },
          { id: '3', submittedAt: '2023-06-23 09:00', status: 'Passed', score: 80 },
        ]), 1000)
      );
      setAttempts(attemptsResponse);
    };

    fetchAssignmentAndAttempts();
  }, [id]);

  const handleNewAttempt = () => {
    // In a real application, this would open the Stackblitz WebContainer
    console.log('Opening Stackblitz WebContainer for a new attempt');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assignment?.title || 'Loading...'}</CardTitle>
        <CardDescription>View your attempts and start a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleNewAttempt} className="mb-4">Start New Attempt</Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell>{attempt.submittedAt}</TableCell>
                <TableCell>{attempt.status}</TableCell>
                <TableCell>{attempt.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default AssignmentAttempts


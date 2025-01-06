import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link } from 'react-router'

interface Attempt {
  id: string;
  assignmentId: string;
  userId: string;
  status: string;
  score: number;
  feedback: string;
  bucketUrl: string;
  updatedAt: string;
}

function AssignmentAttempts() {
  const { id } = useParams<{ id: string }>()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3000/api/attempts/listAttempts')
        
        const data = await response.json()
        setAttempts(data.attempts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch attempts')
      } finally {
        setLoading(false)
      }
    }

    fetchAttempts()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading attempts...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Attempts</CardTitle>
        <CardDescription>View your attempts and start a new one</CardDescription>
      </CardHeader>
      <CardContent>
     
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UserID</TableHead>
              <TableHead>AssignmentID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell>{attempt.userId}</TableCell>
                <TableCell>{attempt.assignmentId}</TableCell>
                <TableCell>{new Date(attempt.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell>{attempt.status}</TableCell>
                <TableCell>{attempt.score}</TableCell>
                <TableCell>{attempt.feedback || '-'}</TableCell>
                <TableCell>
                  {attempt.bucketUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={attempt.bucketUrl} target="_blank" rel="noopener noreferrer">
                        View Submission
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default AssignmentAttempts
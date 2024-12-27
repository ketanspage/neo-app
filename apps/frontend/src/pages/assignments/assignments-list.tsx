import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Assignment {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Not Started' | 'In Progress' | 'Completed';
}

function AssignmentsList() {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    // Simulating API call to fetch assignments
    const fetchAssignments = async () => {
      // In a real application, this would be an API call
      const response = await new Promise<Assignment[]>((resolve) =>
        setTimeout(() => resolve([
          { id: '1', title: 'React State Management with Hooks', description: 'Create a counter using useState', difficulty: 'Beginner', status: 'Not Started' },
          { id: '2', title: 'React Context API', description: 'Implement a theme switcher using Context', difficulty: 'Intermediate', status: 'In Progress' },
          { id: '3', title: 'Redux Toolkit in React', description: 'Build a todo list with Redux Toolkit', difficulty: 'Advanced', status: 'Completed' },
          { id: '4', title: 'React Custom Hooks', description: 'Create a useLocalStorage hook', difficulty: 'Intermediate', status: 'Not Started' },
          { id: '5', title: 'React Performance Optimization', description: 'Optimize a list rendering with useMemo and useCallback', difficulty: 'Advanced', status: 'Not Started' },
        ]), 1000)
      );
      setAssignments(response);
    };

    fetchAssignments();
  }, []);

  const getDifficultyColor = (difficulty: Assignment['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500'
      case 'Intermediate':
        return 'bg-yellow-500'
      case 'Advanced':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-500'
      case 'In Progress':
        return 'bg-blue-500'
      case 'Completed':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div>
      <div className='flex flex-row items-center justify-between mb-10'>
        <div>
          <h1 className='text-2xl font-semibold'>Assignments</h1>
          <p className='text-sm'>Improve your coding skills with these coding challenges</p>
        </div>
        <div>
          <Button asChild>
            <Link to="/assignments/new">Create Assignment</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.description}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(assignment.difficulty)}>
                      {assignment.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild>
                      <Link to={`/assignments/${assignment.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssignmentsList

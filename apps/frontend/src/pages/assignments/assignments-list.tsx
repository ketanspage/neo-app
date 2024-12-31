import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Template {
  id: number;
  name: string;
  description: string;
  bucketUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  templateId: number;
  bucketUrl: string;
  createdAt: string;
  updatedAt: string;
}

function AssignmentsList() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [templates, setTemplates] = useState<{ [key: number]: Template }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch assignments
        const assignmentsResponse = await fetch('http://localhost:3000/api/assignments/listAssignments')
        const assignmentsData = await assignmentsResponse.json()

        if (!assignmentsResponse.ok) {
          throw new Error(assignmentsData.error || 'Failed to fetch assignments')
        }

        // Create a set of unique template IDs
        const templateIds = new Set(assignmentsData.templates.map((assignment: Assignment) => assignment.templateId))

        // Fetch templates
        const templatesMap: { [key: number]: Template } = {}
        for (const templateId of templateIds as Set<number>) {
          if (templateId) { // Check if templateId exists
            const templateResponse = await fetch(`http://localhost:3000/api/templates/getTemplate/${templateId}`)
            const templateData = await templateResponse.json()
            
            if (templateResponse.ok && templateData.template[0]) {
              templatesMap[templateId] = templateData.template[0]
            }
          }
        }

        setAssignments(assignmentsData.templates)
        setTemplates(templatesMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          Loading assignments...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-row items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Improve your coding skills with these coding challenges
          </p>
        </div>
        <div>
          <Button asChild>
            <Link to="/assignments/new">Create Assignment</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>View/Edit Assignment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.description}</TableCell>
                  <TableCell>
                    {assignment.templateId && templates[assignment.templateId] 
                      ? templates[assignment.templateId].name 
                      : 'No template selected'}
                  </TableCell>
                  <TableCell>
                    <Button asChild>
                      <Link to={`/assignments/${assignment.id}`}>Click Me</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
                    No assignments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssignmentsList
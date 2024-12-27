import { Link } from 'react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { templates } from '@/data/templates'

function TemplatesList() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Button asChild>
          <Link to="/templates/new">Create New Template</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col md:flex-row">
            <div className="flex-1 p-6">
              <CardHeader>
                <CardTitle>{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="mt-4">
                  <Link to={`/templates/${template.id}`}>View Template</Link>
                </Button>
              </CardContent>
            </div>
            <div className="flex-1 bg-muted p-6 rounded-r-lg">
              <pre className="text-sm overflow-x-auto">
                <code>{Object.keys(template.files).join('\n')}</code>
              </pre>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TemplatesList

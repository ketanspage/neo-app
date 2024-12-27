import { useParams } from 'react-router'
import { templates } from '@/data/templates'
import CodeContainer from '../assignments/code-container'

function TemplateDetailPage() {
    const { id } = useParams<{ id: string }>()
    const template = templates.find(t => t.id === id)

    if (!template) {
        return <div>Template not found</div>
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">{template.title}</h1>
            <p className="mb-6">{template.description}</p>
            <CodeContainer project={template} />
        </div>
    )
}

export default TemplateDetailPage


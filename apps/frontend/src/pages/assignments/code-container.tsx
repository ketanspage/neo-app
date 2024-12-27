import { useEffect, useRef,useState } from 'react'
import sdk from '@stackblitz/sdk'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CodeContainerProps {
  project: {
    id?: string;
    files: { [key: string]: string };
    title: string;
    description: string;
    dependencies: { [key: string]: string };
    openFile?: string;
    height?: number;
    width?: string;
    initScripts?: string;
  };
}

function CodeContainer({ project }: CodeContainerProps) {
  const { toast } = useToast()
  const containerRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)

  const _embedSDK = async () => {
    try {
      if (containerRef.current) {
        return await sdk.embedProject(
          containerRef.current,
          {
            files: project.files,
            template: 'create-react-app' as const,
            title: project.title ?? `My First Docs!`,
            description: project.description ?? `This is an example of my first doc!`,
          },
          {
            openFile: project?.openFile ?? 'README.md',
            height: project?.height ?? 800,
            width: project.width ?? '100%',
            startScript: project.initScripts,
          }
        )
      } else {
        throw new Error('Container reference is null')
      }
    } catch (error) {
      console.error('Error embedding project:', error)
      toast({
        title: "Error",
        description: "Failed to load the code editor. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    _embedSDK()
  }, [project])

  const onClickSave = async () => {
    setIsSaving(true)
    try {
      const iframe = document.getElementById('embed-container') as HTMLIFrameElement
      if (!iframe) {
        throw new Error('Code editor not found')
      }

      const vm = await sdk.connect(iframe)
      const files = await vm.getFsSnapshot()

      if (!files || Object.keys(files).length === 0) {
        throw new Error('No files found to save')
      }

      await saveToBucket(files)
    } catch (error) {
      console.error('Error getting files:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retrieve your code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveToBucket = async (files: { [key: string]: string }) => {
    try {
      if (!project.title) {
        throw new Error('Project title is required')
      }

      const response = await fetch('http://localhost:3000/api/assignments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: project.title,
          files
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save the code')
      }

      toast({
        title: "Success",
        description: "Your code has been saved to MinIO successfully.",
      })
    } catch (error) {
      console.error('Error saving code via API:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your code to MinIO. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to be caught by the caller
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} id="embed-container" className="w-full" />
      <Button 
        onClick={onClickSave}
        disabled={isSaving}
        className="w-full max-w-xs mx-auto"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Code'
        )}
      </Button>
    </div>
  )
}

export default CodeContainer
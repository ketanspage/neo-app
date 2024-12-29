import { useEffect, useRef } from 'react'
import sdk from '@stackblitz/sdk'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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
  const containerRef = useRef<any>(null)

  const _embedSDK = async () => {
    return sdk.embedProject(
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
  }

  useEffect(() => {
    _embedSDK()
  }, [project]);


  const onClickSave = async () => {
    try {
      const iframe = document.getElementById('embed-container') as HTMLIFrameElement
      const vm = await sdk.connect(iframe)
      const files: any = await vm.getFsSnapshot()

      await saveToBucket(files)
    } catch (error) {
      console.error('Error getting files:', error)
      toast({
        title: "Error",
        description: "Failed to retrieve your code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveToBucket = async (files: { [key: string]: string }) => {
    try {
      const response = await fetch('http://localhost:3000/api/assignments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: project.title, files })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your code has been saved to MinIO via API.",
        })
      } else {
        throw new Error('Failed to save the code')
      }
    } catch (error) {
      console.error('Error saving code via API:', error)
      toast({
        title: "Error",
        description: "Failed to save your code to MinIO via API. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div
        id="embed-container"
        ref={containerRef}
      >
      </div>

      <Button onClick={onClickSave}>Save Code</Button>
    </>
  )
}

export default CodeContainer


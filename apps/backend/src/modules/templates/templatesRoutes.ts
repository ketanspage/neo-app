import express from 'express';
import minioClient from '../../utils/minioClient';

const router = express.Router();


router.get('/listTemplates', async (req, res) => {
    try{
        const bucketName = 'templates'
        const objectList:any = []
        const stream = minioClient.listObjects(bucketName, '', true)
        stream.on('data', (obj) => {
            objectList.push({
                name: obj.name,
                size: obj.size,
                lastModified: obj.lastModified,
                etag: obj.etag,
            })
        })
        stream.on('end', () => {
            res.status(200).json({ templates: objectList })
        })
        stream.on('error', (err) => {
            console.error('Error while listing templates:', err)
            res.status(500).json({ error: 'Failed to list templates' })
        })
    }
    catch(error){
        console.error('Error getting templates:', error)
        res.status(500).json({ error: 'Failed to get templates' })
    }
});

router.get('/getTemplate/:id', async (req, res) => {
    try {
        const { id } = req.params
        const bucketName = 'templates'
        const objectName = `template-${id}.json`
        const stream = await minioClient.getObject(bucketName, objectName)
        let fileContent = ''
        stream.on('data', (chunk) => {
            fileContent += chunk.toString()
        })

        stream.on('end', () => {
            res.status(200).json({ fileContent: JSON.parse(fileContent) })
        })

        stream.on('error', (err) => {
            console.error('Error reading object stream:', err)
            res.status(500).json({ error: 'Failed to get the required template' })
        })
    } catch (error) {
        console.error('Error getting the required template:', error)
        res.status(500).json({ error: 'Failed to get the required template' })
    }
});

router.post('/createTemplate', async (req, res) => {
    try {
        const { id, files } = req.body
        const bucketName = 'templates'
        const objectName = `template-${id}.json`
        const fileContent = JSON.stringify(files)

        await minioClient.putObject(bucketName, objectName, fileContent)

        res.status(200).json({ message: 'Template saved successfully' })
    } catch (error) {
        console.error('Error saving template:', error)
        res.status(500).json({ error: 'Failed to save template' })
    }
});

router.put('/editTemplate/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { files } = req.body
        const bucketName = 'templates'
        const objectName = `template-${id}.json`
        const fileContent = JSON.stringify(files)

        await minioClient.putObject(bucketName, objectName, fileContent)

        res.status(200).json({ message: 'Template updated successfully' })
    } catch (error) {
        console.error('Error updating template:', error)
        res.status(500).json({ error: 'Failed to updating template' })
    }
});
export default router;
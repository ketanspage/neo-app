import express from 'express';
import minioClient from '../../utils/minioClient';

const router = express.Router();

router.get('/listAssignments', async (req, res) => {
    try {
        const bucketName = 'assignments';
        const objectList:any = [];

        const stream = minioClient.listObjects(bucketName, '', true);

        stream.on('data', (obj) => {
            objectList.push({
                name: obj.name,
                size: obj.size,
                lastModified: obj.lastModified,
                etag: obj.etag,
            });
        });

        stream.on('end', () => {
            res.status(200).json({ assignments: objectList });
        });

        stream.on('error', (err) => {
            console.error('Error while listing assignments:', err);
            res.status(500).json({ error: 'Failed to list assignments' });
        });
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});


router.get('/getAssignment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bucketName = 'assignments';
        const objectName = `assignment-${id}.json`;
        const stream = await minioClient.getObject(bucketName, objectName);
        let fileContent = '';
        stream.on('data', (chunk) => {
            fileContent += chunk.toString();
        });

        stream.on('end', () => {
            res.status(200).json({ fileContent: JSON.parse(fileContent) });
        });

        stream.on('error', (err) => {
            console.error('Error reading object stream:', err);
            res.status(500).json({ error: 'Failed to get the required assignment' });
        });
    } catch (error) {
        console.error('Error getting the required assignment:', error);
        res.status(500).json({ error: 'Failed to get the required assignment' });
    }
});


router.post('/createAssignment', async (req, res) => {
    try {
        const { id, files } = req.body
        const bucketName = 'assignments'
        const objectName = `assignment-${id}.json`
        const fileContent = JSON.stringify(files)

        await minioClient.putObject(bucketName, objectName, fileContent)

        res.status(200).json({ message: 'Assignment saved successfully' })
    } catch (error) {
        console.error('Error saving assignment:', error)
        res.status(500).json({ error: 'Failed to save assignment' })
    }
});

router.put('/editAssignment/:id',async(req,res)=>{
    try{
        const {id}=req.params
        const {files}=req.body
        const bucketName='assignments'
        const objectName=`assignment-${id}.json`
        const fileContent=JSON.stringify(files)
        await minioClient.putObject(bucketName,objectName,fileContent)
        res.status(200).json({message:'Assignment updated successfully'})
    }catch(error){
        console.error('Error updating assignment:',error)
        res.status(500).json({error:'Failed to update assignment'})
    }
})

export default router;
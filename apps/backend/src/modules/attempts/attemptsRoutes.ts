import  express from "express";
import minioClient from "../../utils/minioClient";
const router = express.Router();
router.get('/listAttempts',async (req, res) => {
    try {
        const bucketName = 'attempts';
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
            res.status(200).json({ attempts: objectList });
        });
        stream.on('error', (err) => {
            console.error('Error while listing attempts:', err);
            res.status(500).json({ error: 'Failed to list attempts' });
        });
    } catch (error) {
        console.error('Error getting attempts:', error);
        res.status(500).json({ error: 'Failed to get attempts' });
    }
});

router.get('/getAttempt/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bucketName = 'attempts';
        const objectName = `attempt-${id}.json`;
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
            res.status(500).json({ error: 'Failed to get the required attempt' });
        });
    } catch (error) {
        console.error('Error getting the required attempt:', error);
        res.status(500).json({ error: 'Failed to get the required attempt' });
    }
});

router.post('/createAttempt', async (req, res) => {
    try {
        const { id, files } = req.body;
        const bucketName = 'attempts';
        const objectName = `attempt-${id}.json`;
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);
        res.status(200).json({ message: 'Attempt saved successfully' });
    } catch (error) {
        console.error('Error saving attempt:', error);
        res.status(500).json({ error: 'Failed to save attempt' });
    }
});

router.put('/editAttempt/:id', async (req, res) => {
    try {
        const{ id } = req.params;
        const { files } = req.body;
        const bucketName = 'attempts';
        const objectName = `attempt-${id}.json`;
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);
        res.status(200).json({ message: 'Attempt updated successfully' });
    } catch (error) {
        console.error('Error updating attempt:', error);
        res.status(500).json({ error: 'Failed to updating attempt' });
    }
});

export default router;
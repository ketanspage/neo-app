import  express from "express";
import minioClient from "../../utils/minioClient";
import db from "../../db";
import { assignmentAttempts } from "../../db/schema";
import { eq } from "drizzle-orm";
const router = express.Router();

const generatePresignedUrl = async(bucketName: string, objectName: string): Promise<string> => {
    try {
        return await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

router.get('/listAttempts',async (req, res) => {
    try{
        const allAttempts = await db 
        .select({
            id: assignmentAttempts.id,
            assignmentId: assignmentAttempts.assignmentId,
            userId: assignmentAttempts.userId,
            status: assignmentAttempts.status,
            score: assignmentAttempts.score,
            feedback: assignmentAttempts.feedback,
            bucketUrl: assignmentAttempts.bucketUrl,
            updatedAt: assignmentAttempts.updatedAt
        })
        .from(assignmentAttempts)
        .orderBy(assignmentAttempts.updatedAt);
        res.status(200).json({
            message: 'Attempts fetched successfully',
            attempts: allAttempts,
            count: allAttempts.length
        })
    }
    catch (error) {
        console.error('Error getting attempts:', error);
        res.status(500).json({ error: 'Failed to get attempts' });
    }
});

router.get('/getAttempt/:id', async (req:any, res:any) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }
        const getAttempt=await db
        .select({
            id: assignmentAttempts.id,
            assignmentId: assignmentAttempts.assignmentId,
            userId: assignmentAttempts.userId,
            status: assignmentAttempts.status,
            score: assignmentAttempts.score,
            feedback: assignmentAttempts.feedback,
            bucketUrl: assignmentAttempts.bucketUrl,
            updatedAt: assignmentAttempts.updatedAt
        })
        .from(assignmentAttempts)
        .where(eq(assignmentAttempts.id,parseInt(id)));
        if (getAttempt.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const assignment = getAttempt[0];
        const bucketName = 'attempts';
        const objectName = `attempt-${id}.json`;
        try{
            const dataStream = await minioClient.getObject(bucketName, objectName);
            let fileContent = '';

            for await (const chunk of dataStream) {
                fileContent += chunk;
            }

            let files;
            try {
                files = JSON.parse(fileContent);
            } catch (parseError) {
                console.error('Error parsing file content:', parseError);
                return res.status(500).json({ error: 'Failed to parse files' });
            }

            return res.status(200).json({
                message: 'Required assignment fetched successfully',
                assignments: [{
                    ...assignment,
                    files
                }],
                count: 1
            });
        }catch(minioError){
            console.error('MinIO error:', minioError);
            return res.status(500).json({ error: 'Failed to retrieve attempt files from storage' });
      
        }
    } catch (error) {
        console.error('Error getting the required assignment attempt:', error);
        return res.status(500).json({
            error:'Failed to get the required assignment attempt',
            details : (error as Error).message
        })
    }
});

router.post('/createAttempt', async (req, res) => {
    try {
        const { files, assignmentId, userId,status,score, feedback } = req.body;
        const bucketName = 'attempts';
        const [newAttempt] = await db
            .insert(assignmentAttempts)
            .values({
                assignmentId,
                userId:1,
                score,
                status,
                feedback,
                bucketUrl: '',
                updatedAt: new Date(),
            })
            .returning();
        
        const objectName = `attempt-${newAttempt.id}.json`;
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);
        
        const bucketUrl = await generatePresignedUrl(bucketName, objectName);

        await db
            .update(assignmentAttempts)
            .set({ bucketUrl })
            .where(eq(assignmentAttempts.id,newAttempt.id))
        res.status(200).json({ 
            message: 'Attempt saved successfully' ,
            attempt: {
            ...newAttempt,
            bucketUrl
        }
        });
    } catch (error) {
        console.error('Error saving attempt:', error);
        res.status(500).json({ error: 'Failed to save attempt' });
    }
});



export default router;
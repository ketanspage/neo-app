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

router.get('/getAttempt/:id', async (req, res) => {
    try {
        const {id}=req.params;
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
        res.status(200).json({
            message: 'Required attempt fetched successfully',
            attempt: getAttempt,
            count: getAttempt.length
        });
    } catch (error) {
        console.error('Error getting the required attempt:', error);
        res.status(500).json({ error: 'Failed to get the required attempt' });
    }
});

router.post('/createAttempt', async (req, res) => {
    try {
        const { files, assignmentId, userId, status, score, feedback } = req.body;
        const bucketName = 'attempts';
        const [newAttempt] = await db
            .insert(assignmentAttempts)
            .values({
                assignmentId,
                userId,
                status,
                score,
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

router.put('/editAttempt/:id', async (req, res) => {
    try {
        const{ id } = req.params;
        const { assignmentId,userId,status,score,feedback,files } = req.body;
        const bucketName = 'attempts';
        const objectName = `attempt-${id}.json`;
        const bucketUrl = await generatePresignedUrl(bucketName, objectName);
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);
        const [updatedAttempt]=await db
        .update(assignmentAttempts)
        .set({
            assignmentId
            ,userId
            ,status
            ,score
            ,feedback
            ,bucketUrl
            ,updatedAt: new Date(),
        })
        .where(eq(assignmentAttempts.id,parseInt(id)))
        .returning();
        res.status(200).json({
            message: 'Attempt updated successfully',
            attempt: updatedAttempt
        });
    } catch (error) {
        console.error('Error updating attempt:', error);
        res.status(500).json({ error: 'Failed to updating attempt' });
    }
});

export default router;
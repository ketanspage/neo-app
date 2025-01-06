import express from 'express';
import minioClient from '../../utils/minioClient';
import db from '../../db';
import { assignments } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

const generatePresignedUrl=async(bucketName:string,objectName:string):Promise<string>=>{
    try{
        return await minioClient.presignedGetObject(bucketName,objectName,7*24*60*60);
    }catch(error){
        console.error('Error generating presigned URL:',error);
        throw error;
    }
}

router.get('/listAssignments', async (req, res) => {
    try {
        const allAssignments=await db
            .select({
                id:assignments.id,
                title:assignments.title,
                description:assignments.description,
                difficulty:assignments.difficulty,
                templateId:assignments.templateId,
                bucketUrl:assignments.bucketUrl,
                createdAt:assignments.createdAt,
                updatedAt:assignments.updatedAt
            })
            .from(assignments)
            .orderBy(assignments.updatedAt);
        res.status(200).json({
            message:'Assignments fetched successfully',
            assignments:allAssignments,
            count:allAssignments.length
        });
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});


router.get('/getAssignment/:id', async (req:any, res:any) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }
        const getAssignment= await db
            .select({
                id:assignments.id,
                title:assignments.title,
                description:assignments.description,
                difficulty:assignments.difficulty,
                templateId:assignments.templateId,
                bucketUrl:assignments.bucketUrl,
                createdAt:assignments.createdAt,
                updatedAt:assignments.updatedAt
            })
            .from(assignments)
            .where(eq(assignments.id, parseInt(id))
        );
        if (getAssignment.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const assignment = getAssignment[0];
        const bucketName = 'assignments';
        const objectName = `assignment-${id}.json`;
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
                return res.status(500).json({ error: 'Failed to parse assignment files' });
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
            return res.status(500).json({ error: 'Failed to retrieve assignment files from storage' });
      
        }
    } catch (error) {
        console.error('Error getting the required assignment:', error);
        return res.status(500).json({
            error:'Failed to get the required assignment',
            details : (error as Error).message
        })
    }
});

router.post('/createAssignment', async (req, res) => {
    try {
        const { title, description,difficulty, templateId, files } = req.body;
        const bucketName = 'assignments';

        // First, insert into the database to get the generated ID
        const [newAssignment] = await db
            .insert(assignments)
            .values({
                title,
                description,
                difficulty,
                templateId: templateId || null,
                bucketUrl: '', // Temporary empty value
                updatedAt: new Date(),
            })
            .returning();

        // Generate object name using the database-generated ID
        const objectName = `assignment-${newAssignment.id}.json`;
        const fileContent = JSON.stringify(files);

        // Upload to MinIO
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Generate the bucket URL
        const bucketUrl = await generatePresignedUrl(bucketName, objectName);

        // Update the assignment record with the bucket URL
        await db
            .update(assignments)
            .set({ bucketUrl })
            .where(eq(assignments.id, newAssignment.id));

        res.status(200).json({ 
            message: 'Assignment saved successfully',
            assignment: {
                ...newAssignment,
                bucketUrl
            }
        });
    } catch (error) {
        console.error('Error saving assignment:', error);
        res.status(500).json({ error: 'Failed to save assignment' });
    }
});

// Updated editAssignment endpoint to handle both MinIO and database operations
router.put('/editAssignment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description,difficulty, templateId, files } = req.body;
        const bucketName = 'assignments';
        const objectName = `assignment-${id}.json`;
        
        // Update MinIO
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);

        const signedUrl = await generatePresignedUrl(bucketName, objectName);
        // Update database
        const [updatedAssignment] = await db
            .update(assignments)
            .set({
                title,
                description,
                difficulty,
                templateId: templateId || null,
                bucketUrl: signedUrl,
                updatedAt: new Date(),
            })
            .where(eq(assignments.id, parseInt(id)))
            .returning();

        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment: updatedAssignment
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
});

export default router;
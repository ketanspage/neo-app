import express from 'express';
import minioClient from '../../utils/minioClient';
import db from '../../db';
import { assignments } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/listAssignments', async (req, res) => {
    try {
        const allAssignments=await db
            .select({
                id:assignments.id,
                title:assignments.title,
                description:assignments.description,
                templateId:assignments.templateId,
                bucketUrl:assignments.bucketUrl,
                createdAt:assignments.createdAt,
                updatedAt:assignments.updatedAt
            })
            .from(assignments)
            .orderBy(assignments.updatedAt);
        res.status(200).json({
            message:'Assignments fetched successfully',
            templates:allAssignments,
            count:allAssignments.length
        });
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});


router.get('/getAssignment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const getTemplates= await db
            .select({
                id:assignments.id,
                title:assignments.title,
                description:assignments.description,
                templateId:assignments.templateId,
                bucketUrl:assignments.bucketUrl,
                createdAt:assignments.createdAt,
                updatedAt:assignments.updatedAt
            })
            .from(assignments)
            .where(eq(assignments.id, parseInt(id))
        );

        res.status(200).json({
            message:'Required assignment fetched successfully',
            templates:getTemplates,
            count:getTemplates.length
         });
    } catch (error) {
        console.error('Error getting the required assignment:', error);
        res.status(500).json({ error: 'Failed to get the required assignment' });
    }
});

router.post('/createAssignment', async (req, res) => {
    try {
        const { title, description, templateId, files } = req.body;
        const bucketName = 'assignments';

        // First, insert into the database to get the generated ID
        const [newAssignment] = await db
            .insert(assignments)
            .values({
                title,
                description,
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
        const bucketUrl = `${bucketName}/${objectName}`;

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
        const { title, description, templateId, files } = req.body;
        const bucketName = 'assignments';
        const objectName = `assignment-${id}.json`;
        const bucketUrl = `${bucketName}/${objectName}`;

        // Update MinIO
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Update database
        const [updatedAssignment] = await db
            .update(assignments)
            .set({
                title,
                description,
                templateId: templateId || null,
                bucketUrl,
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
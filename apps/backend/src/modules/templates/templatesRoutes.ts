import express from 'express';
import minioClient from '../../utils/minioClient';
import db from '../../db';
import { templates } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Helper function to generate presigned URL
async function generatePresignedUrl(bucketName: string, objectName: string): Promise<string> {
    try {
        return await minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60); // 24 hours expiry
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

router.get('/listTemplates', async (req, res) => {
    try {
        const allTemplates = await db
            .select({
                id: templates.id,
                name: templates.name,
                description: templates.description,
                signedUrl: templates.bucketUrl,
                createdAt: templates.createdAt,
                updatedAt: templates.updatedAt
            })
            .from(templates)
            .orderBy(templates.updatedAt);

        res.status(200).json({ 
            message: 'Templates fetched successfully',
            templates: allTemplates,
            count: allTemplates.length 
        });
    } catch (error) {
        console.error('Error fetching templates from database:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

router.get('/getTemplate/:id', async (req:any, res:any) => {
    try {
        const { id } = req.params;
        const getTemplate = await db
            .select({
                id: templates.id,
                name: templates.name,
                description: templates.description,
                bucketUrl: templates.bucketUrl,
                createdAt: templates.createdAt,
                updatedAt: templates.updatedAt
            })
            .from(templates)
            .where(eq(templates.id, parseInt(id)));

        if (getTemplate.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Get the template's file content from MinIO
        const template = getTemplate[0];
        if (!template.bucketUrl) {
            return res.status(400).json({ error: 'Template bucket URL is missing' });
        }
        const [bucket, ...objectPathParts] = template.bucketUrl.split('/');
        const objectName = objectPathParts.join('/');

        const dataStream = await minioClient.getObject(bucket, objectName);
        let fileContent = '';

        // Read the stream
        for await (const chunk of dataStream) {
            fileContent += chunk;
        }

        // Parse the JSON content
        const files = JSON.parse(fileContent);

        res.status(200).json({
            message: 'Required template fetched successfully',
            template: [{
                ...template,
                files
            }],
            count: 1
        });
    } catch (error) {
        console.error('Error getting the required template:', error);
        res.status(500).json({ error: 'Failed to get the required template' });
    }
});

router.post('/createTemplate', async (req, res) => {
    try {
        const { name, description, files } = req.body;
        const bucketName = 'templates';

        // First, insert into the database to get the generated ID
        const [newTemplate] = await db
            .insert(templates)
            .values({
                name,
                description,
                bucketUrl: '', // Temporary empty value
                updatedAt: new Date(),
            })
            .returning();

        const objectName = `template-${newTemplate.id}.json`;
        const fileContent = JSON.stringify(files);

        // Upload to MinIO
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Generate presigned URL
        const signedUrl = await generatePresignedUrl(bucketName, objectName);

        // Update the template record with the signed URL
        const [updatedTemplate] = await db
            .update(templates)
            .set({ bucketUrl: signedUrl })
            .where(eq(templates.id, newTemplate.id))
            .returning();

        res.status(200).json({
            message: 'Template saved successfully',
            template: updatedTemplate
        });
    } catch (error) {
        console.error('Error saving template:', error);
        res.status(500).json({ error: 'Failed to save template' });
    }
});

router.put('/editTemplate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, files } = req.body;
        const bucketName = 'templates';
        const objectName = `template-${id}.json`;

        // Upload to MinIO
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Generate new presigned URL
        const signedUrl = await generatePresignedUrl(bucketName, objectName);

        // Update database with new signed URL
        const [updatedTemplate] = await db
            .update(templates)
            .set({
                name,
                description,
                bucketUrl: signedUrl,
                updatedAt: new Date(),
            })
            .where(eq(templates.id, parseInt(id)))
            .returning();

        res.status(200).json({
            message: 'Template updated successfully',
            template: updatedTemplate
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

export default router;
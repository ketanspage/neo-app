import express from 'express';
import minioClient from '../../utils/minioClient';
import db from '../../db';
import { templates } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/listTemplates', async (req, res) => {
    try {
        // Query all templates from the database, ordered by latest first
        const allTemplates = await db
            .select({
                id: templates.id,
                name: templates.name,
                description: templates.description,
                bucketUrl: templates.bucketUrl,
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

router.get('/getTemplate/:id', async (req, res) => {
    try {
        const { id } = req.params
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
        res.status(200).json({
            message: 'Required template fetched successfully',
            template: getTemplate,
            count: getTemplate.length
        });
    } catch (error) {
        console.error('Error getting the required template:', error)
        res.status(500).json({ error: 'Failed to get the required template' })
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

        // Generate object name using the database-generated ID
        const objectName = `template-${newTemplate.id}.json`;
        const fileContent = JSON.stringify(files);

        // Upload to MinIO
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Generate the bucket URL
        const bucketUrl = `${bucketName}/${objectName}`;

        // Update the template record with the bucket URL
        await db
            .update(templates)
            .set({ bucketUrl })
            .where(eq(templates.id, newTemplate.id));

        res.status(200).json({
            message: 'Template saved successfully',
            template: {
                ...newTemplate,
                bucketUrl
            }
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
        const bucketUrl = `${bucketName}/${objectName}`;

        // Update MinIO
        const fileContent = JSON.stringify(files);
        await minioClient.putObject(bucketName, objectName, fileContent);

        // Update database
        const [updatedTemplate] = await db
            .update(templates)
            .set({
                name,
                description,
                bucketUrl,
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

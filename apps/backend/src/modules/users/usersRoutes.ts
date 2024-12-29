import express from 'express';
import minioClient from '../../utils/minioClient';
import db from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import e from 'express';

const router = express.Router();

router.get('/listUsers', async (req, res) => {
    try {
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                age: users.age,
                email: users.email,
                createdAt: users.createdAt
            })
            .from(users)
            .orderBy(users.createdAt);
        res.status(200).json({
            message: 'Users fetched successfully',
            users: allUsers,
            count: allUsers.length
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

router.get('/getUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const getUser = await db
            .select({
                id: users.id,
                name: users.name,
                age: users.age,
                email: users.email,
                createdAt: users.createdAt
            })
            .from(users)
            .where(eq(users.id, parseInt(id)));
        res.status(200).json({
            message: 'Required user fetched successfully',
            user: getUser,
            count: getUser.length
        });
    } catch (error) {
        console.error('Error getting the required user:', error);
        res.status(500).json({ error: 'Failed to get the required user' });
    }
});

router.post('/createUser', async (req, res) => {
    try {
        const { name, age, email, passwordHash } = req.body;
        const newUser = await db
            .insert(users)
            .values({
                name,
                age,
                email,
                passwordHash
            })
            .returning();
        res.status(200).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/editUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, email, passwordHash } = req.body;
        const updatedUser = await db
            .update(users)
            .set({
                name,
                age,
                email,
                passwordHash
            })
            .where(eq(users.id, parseInt(id)))
            .returning();
        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
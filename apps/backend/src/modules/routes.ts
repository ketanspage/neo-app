import express from 'express';
import assignmentRoutes from './assignment/assignmentRoutes';
import templatesRoutes from './templates/templatesRoutes';
import attemptsRoutes from './attempts/attemptsRoutes';
import userRoutes from './users/usersRoutes';
const router = express.Router();

router.use('/assignments', assignmentRoutes);
router.use('/attempts', attemptsRoutes);
router.use('/templates', templatesRoutes);
router.use('/users', userRoutes);
export default router;
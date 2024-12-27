import express from 'express';
import assignmentRoutes from './assignment/assignmentRoutes';
import templatesRoutes from './templates/templatesRoutes';
const router = express.Router();

router.use('/assignments', assignmentRoutes);
router.use('/attempts', templatesRoutes);
router.use('/templates', templatesRoutes);
export default router;
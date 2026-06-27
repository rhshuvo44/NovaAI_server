import { Router } from 'express';
import * as dashboardController from '@modules/dashboard/controllers/dashboard.controller';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/overview', dashboardController.getOverview);

export default router;

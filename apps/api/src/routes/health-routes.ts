import { Router } from 'express';
import { HealthController } from '../controllers/HealthController.js';

const router = Router();
const healthController = new HealthController();

// Health check endpoints
router.get('/health', healthController.check.bind(healthController));
router.get('/ready', healthController.ready.bind(healthController));

export default router;

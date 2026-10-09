import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, authorizeRoles } from '../middlewares';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AuditController();

router.use(authenticate);
router.use(authorizeRoles(Role.ADMIN));
router.get('/', controller.list);

export default router;

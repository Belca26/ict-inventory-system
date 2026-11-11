import { Request, Response, NextFunction, Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as notificationService from './notification.service';

async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.listMyNotifications(
      req.user!.sub,
      req.user!.departmentId,
      unreadOnly,
    );
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
}

async function markReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markNotificationRead(
      req.params.id,
      req.user!.sub,
      req.user!.departmentId,
    );
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(authenticate);
router.get('/', listHandler); // ?unreadOnly=true
router.patch('/:id/read', markReadHandler);

export default router;

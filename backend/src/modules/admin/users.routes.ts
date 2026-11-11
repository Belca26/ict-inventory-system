import { Request, Response, NextFunction, Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema, resetPasswordSchema, listUsersQuerySchema } from './users.schema';

function auditCtx(req: Request) {
  return { userId: req.user!.sub, ipAddress: req.ip };
}

async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await usersService.createUser(req.body, auditCtx(req)));
  } catch (err) {
    next(err);
  }
}

async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await usersService.listUsers(req.query));
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await usersService.updateUser(req.params.id, req.body, auditCtx(req)));
  } catch (err) {
    next(err);
  }
}

async function deactivateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deactivateUser(req.params.id, auditCtx(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.adminResetPassword(req.params.id, req.body.temporaryPassword, auditCtx(req));
    res.status(200).json({ message: 'Password reset. All existing sessions for this user have been revoked.' });
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(authenticate, authorize(RoleName.SYSTEM_ADMIN)); // entire module is Admin-only

router.get('/', validate(listUsersQuerySchema), listHandler);
router.post('/', validate(createUserSchema), createHandler);
router.patch('/:id', validate(updateUserSchema), updateHandler);
router.delete('/:id', deactivateHandler);
router.post('/:id/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

export default router;

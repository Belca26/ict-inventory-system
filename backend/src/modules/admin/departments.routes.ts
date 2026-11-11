import { z } from 'zod';
import { Request, Response, NextFunction, Router } from 'express';
import { RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { AuthError } from '../auth/auth.service';
import { writeAuditLog } from '../../utils/audit';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    buildingId: z.string().cuid().optional(),
    floor: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional(),
  }),
});

const updateDepartmentSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: createDepartmentSchema.shape.body.partial(),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await prisma.department.findMany({
  include: {
    _count: {
      select: {
        assets: true,
        users: true,
      },
    },
  },
  orderBy: {
    name: 'asc',
  },
});
    res.status(200).json(departments);
  } catch (err) {
    next(err);
  }
}

async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await prisma.department.create({ data: req.body });
    await writeAuditLog({ userId: req.user!.sub, ipAddress: req.ip }, 'CREATE', 'Department', department.id, null, department);
    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
}

async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AuthError('Department not found', 404);

    const department = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    await writeAuditLog({ userId: req.user!.sub, ipAddress: req.ip }, 'UPDATE', 'Department', department.id, existing, department);
    res.status(200).json(department);
  } catch (err) {
    next(err);
  }
}

async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const [assetCount, userCount] = await Promise.all([
      prisma.asset.count({ where: { departmentId: req.params.id } }),
      prisma.user.count({ where: { departmentId: req.params.id } }),
    ]);
    if (assetCount > 0 || userCount > 0) {
      throw new AuthError(
        `Cannot delete: department has ${assetCount} asset(s) and ${userCount} user(s) still assigned. Reassign them first.`,
        409,
      );
    }

    const existing = await prisma.department.delete({ where: { id: req.params.id } });
    await writeAuditLog({ userId: req.user!.sub, ipAddress: req.ip }, 'DELETE', 'Department', req.params.id, existing, null);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const router = Router();
router.use(authenticate);

// Every role can list departments (needed for dropdowns, e.g. registering an asset).
router.get('/', listHandler);

// Only Admins configure departments.
router.post('/', authorize(RoleName.SYSTEM_ADMIN), validate(createDepartmentSchema), createHandler);
router.patch('/:id', authorize(RoleName.SYSTEM_ADMIN), validate(updateDepartmentSchema), updateHandler);
router.delete('/:id', authorize(RoleName.SYSTEM_ADMIN), deleteHandler);

export default router;

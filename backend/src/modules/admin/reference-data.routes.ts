import { z } from 'zod';
import { Request, Response, NextFunction, Router } from 'express';
import { RoleName, DeviceCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(authenticate);
const adminOnly = authorize(RoleName.SYSTEM_ADMIN);

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

const createBuildingSchema = z.object({
  body: z.object({ name: z.string().min(1), campus: z.string().min(1) }),
});

router.get('/buildings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await prisma.building.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

router.post('/buildings', adminOnly, validate(createBuildingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await prisma.building.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

const createRoomSchema = z.object({
  body: z.object({ name: z.string().min(1), floor: z.string().optional(), buildingId: z.string().cuid() }),
});

router.get('/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buildingId = req.query.buildingId as string | undefined;
    res.json(
      await prisma.room.findMany({
        where: buildingId ? { buildingId } : undefined,
        include: { building: true },
        orderBy: { name: 'asc' },
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/rooms', adminOnly, validate(createRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await prisma.room.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Asset Types
// ---------------------------------------------------------------------------

const createAssetTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    category: z.nativeEnum(DeviceCategory),
  }),
});

router.get('/asset-types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await prisma.assetType.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

router.post('/asset-types', adminOnly, validate(createAssetTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await prisma.assetType.create({ data: req.body }));
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Manufacturers
// ---------------------------------------------------------------------------

const createManufacturerSchema = z.object({ body: z.object({ name: z.string().min(1) }) });

router.get('/manufacturers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await prisma.manufacturer.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/manufacturers',
  adminOnly,
  validate(createManufacturerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await prisma.manufacturer.create({ data: req.body }));
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Procedure Types (the maintenance checklist items)
// ---------------------------------------------------------------------------

router.get('/procedure-types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await prisma.procedureType.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
});

export default router;

import { Request, Response, NextFunction, Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { searchAssetsQuerySchema } from './search.schema';
import { searchAssets } from './search.service';

async function searchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchAssets(req.query, {
      role: req.user!.role,
      departmentId: req.user!.departmentId,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(authenticate); // all 4 roles can search — Auditor and Dept Rep included

router.get('/assets', validate(searchAssetsQuerySchema), searchHandler);

export default router;

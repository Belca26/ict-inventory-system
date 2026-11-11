import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';

/**
 * Usage: router.post('/assets', authenticate, authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN), handler)
 * Must run AFTER `authenticate` — it reads req.user set by that middleware.
 */
export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden — you do not have permission to perform this action',
      });
    }

    next();
  };
}

/**
 * For Department Representatives: restricts access to records belonging to
 * their own department. Call this in the controller/service layer after
 * fetching the target entity's departmentId — it can't be a blanket route
 * middleware since the department ownership check depends on the specific
 * asset/record being accessed.
 */
export function assertSameDepartmentOrElevated(
  userRole: RoleName,
  userDepartmentId: string | null,
  resourceDepartmentId: string | null,
): boolean {
  if (userRole === RoleName.SYSTEM_ADMIN || userRole === RoleName.AUDITOR) return true;
  if (userRole !== RoleName.DEPARTMENT_REPRESENTATIVE) return true; // technicians aren't department-scoped
  return userDepartmentId !== null && userDepartmentId === resourceDepartmentId;
}

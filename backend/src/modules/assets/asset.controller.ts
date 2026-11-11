import { Request, Response, NextFunction } from 'express';
import * as assetService from './asset.service';

function contextFrom(req: Request) {
  return {
    userId: req.user!.sub,
    role: req.user!.role,
    departmentId: req.user!.departmentId,
    ipAddress: req.ip,
  };
}

export async function createAssetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.createAsset(req.body, contextFrom(req));
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

export async function getAssetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.getAssetById(req.params.id, contextFrom(req));
    res.status(200).json(asset);
  } catch (err) {
    next(err);
  }
}

export async function listAssetsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assetService.listAssets(req.query, contextFrom(req));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateAssetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, contextFrom(req));
    res.status(200).json(asset);
  } catch (err) {
    next(err);
  }
}

export async function changeAssetStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.changeAssetStatus(req.params.id, req.body.status, contextFrom(req));
    res.status(200).json(asset);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await assetService.softDeleteAsset(req.params.id, contextFrom(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

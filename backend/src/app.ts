import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import assetRoutes from './modules/assets/asset.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import searchRoutes from './modules/search/search.routes';
import reportRoutes from './modules/reports/reports.routes';
import dashboardRoutes from './modules/reports/dashboard.routes';
import exportRoutes from './modules/export/export.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import userAdminRoutes from './modules/admin/users.routes';
import departmentRoutes from './modules/admin/departments.routes';
import referenceDataRoutes from './modules/admin/reference-data.routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userAdminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reference', referenceDataRoutes); // buildings, rooms, asset-types, manufacturers, procedure-types

// NOTE: uploaded attachments are deliberately NOT served via a public static
// route (e.g. app.use('/uploads', express.static(...))) — maintenance photos
// and invoices can contain sensitive info. Serve them through an authenticated
// download endpoint instead if a future report needs to embed them.

app.use(errorHandler);

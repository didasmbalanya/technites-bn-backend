/* eslint-disable no-irregular-whitespace */
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../../swagger.json';
import AuthRoutes from './AuthRoutes';
import UserRoutes from './UserRoutes';
import AdminRoute from './AdminRoutes';
import RequestRoutes from './RequestRoutes';
import AccommodationRoutes from './AccomodationsRoutes';
import HostRoute from './HostRoutes';
import LocationRoutes from './LocationRoutes';

const router = new Router();

router.use('/auth', AuthRoutes);
// router.use('/', UserRoutes);
router.use('/users', UserRoutes);
router.use('/requests', RequestRoutes);
router.use('/accommodations', AccommodationRoutes);
router.use('/locations', LocationRoutes);

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

router.use('/admin', AdminRoute);
router.use('/hosts', HostRoute);
export default router;

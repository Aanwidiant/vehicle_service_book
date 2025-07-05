import { Hono } from 'hono';
import { protect } from '../middlewares';
import { vehicle } from '../controllers';

const vehicles = new Hono();

vehicles.get('/', protect, (c) => vehicle.getAllVehicles(c));
vehicles.get('/:id', protect, (c) => vehicle.getVehicle(c));
vehicles.post('/', protect, (c) => vehicle.createVehicle(c));
vehicles.patch('/:id', protect, (c) => vehicle.updateVehicle(c));
vehicles.delete('/:id', protect, (c) => vehicle.deleteVehicle(c));
vehicles.post('/image/:id', protect, (c) => vehicle.uploadImage(c));

export default vehicles;

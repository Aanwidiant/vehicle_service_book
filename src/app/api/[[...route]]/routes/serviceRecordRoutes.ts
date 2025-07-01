import { Hono } from 'hono';
import { protect } from '../middlewares';
import { serviceRecord } from '../controllers';

const serviceRecords = new Hono();

serviceRecords.get('/:id', protect, (c) => serviceRecord.getServiceRecordsByVehicleId(c));
serviceRecords.get('/:id', protect, (c) => serviceRecord.getServiceRecordById(c));
serviceRecords.post('/', protect, (c) => serviceRecord.createServiceRecord(c));
serviceRecords.patch('/:id', protect, (c) => serviceRecord.updateServiceRecord(c));
serviceRecords.delete('/:id', protect, (c) => serviceRecord.deleteServiceRecord(c));

export default serviceRecords;

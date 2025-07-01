import { Hono } from 'hono';
import { protect } from '../middlewares';
import { reminderSetting } from '../controllers';

const reminderSettings = new Hono();

reminderSettings.get('/', protect, (c) => reminderSetting.getReminderSettingsByUser(c));
reminderSettings.post('/', protect, (c) => reminderSetting.createReminderSetting(c));
// reminderSettings.patch('/:id', protect, (c) => reminderSetting.updateVehicle(c));
reminderSettings.delete('/:id', protect, (c) => reminderSetting.deleteReminderSetting(c));

export default reminderSettings;

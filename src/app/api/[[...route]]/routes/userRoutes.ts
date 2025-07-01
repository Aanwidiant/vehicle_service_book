import { Hono } from 'hono';
import { protect } from '../middlewares';
import { user } from '../controllers';

const users = new Hono();

users.post('/', (c) => user.registerUser(c));
users.patch('/:id', protect, (c) => user.updateUser(c));
users.delete('/:id', protect, (c) => user.deleteUser(c));
users.post('/login', (c) => user.loginUser(c));

export default users;

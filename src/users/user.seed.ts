import { Repository } from 'typeorm';
import { User } from './user.entity';

export class UserSeed {
  static async run(userRepository: Repository<User>) {
    const admin = await userRepository.findOne({ where: { email: process.env.ADMIN_EMAIL } });

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined');
    }

    if (!admin) {
      await userRepository.save({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        firstName: 'Admin',
        username: 'Admin',
        lastName: 'User',
        isActive: true,
      });
      console.log('User admin créé');
      
    } else {
      console.log('User admin déjà existant');
    }
  }
}

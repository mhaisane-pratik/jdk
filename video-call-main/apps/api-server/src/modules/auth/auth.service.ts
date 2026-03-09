import { AppDataSource } from "../../config/data-source";
import { User } from "../user/user.entity"; 
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async loginOrRegister(username: string) {
    // 1. Check if user exists
    let user = await this.userRepo.findOne({ where: { username: username } });

    // 2. If not, CREATE them
    if (!user) {
      console.log(`🆕 Creating User: ${username}`);
      
      // Use a default ID for the company to prevent null errors
      const safeCompanyId = "192d1bcd-f196-4a85-b4ed-bb64a34e93ca"; 

      user = this.userRepo.create({
        username: username,
        email: `${username.replace(/\s/g, '').toLowerCase()}@zatchat.com`,
        companyId: safeCompanyId, 
        role: 'PARTICIPANT',
        isActive: true,
        // ✅ FIX: Send a dummy string instead of null to satisfy the Database
        passwordHash: "no_password_required" 
      });
      
      await this.userRepo.save(user);
    }

    return user;
  }
}
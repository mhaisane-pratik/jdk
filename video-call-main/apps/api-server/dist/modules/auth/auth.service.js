"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const data_source_1 = require("../../config/data-source");
const user_entity_1 = require("../user/user.entity");
class AuthService {
    constructor() {
        this.userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    }
    async loginOrRegister(username) {
        let user = await this.userRepo.findOne({ where: { username: username } });
        if (!user) {
            console.log(`🆕 Creating User: ${username}`);
            const safeCompanyId = "192d1bcd-f196-4a85-b4ed-bb64a34e93ca";
            user = this.userRepo.create({
                username: username,
                email: `${username.replace(/\s/g, '').toLowerCase()}@zatchat.com`,
                companyId: safeCompanyId,
                role: 'PARTICIPANT',
                isActive: true,
                passwordHash: "no_password_required"
            });
            await this.userRepo.save(user);
        }
        return user;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map
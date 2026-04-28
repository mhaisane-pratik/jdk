import { User } from "../user/user.entity";
export declare class AuthService {
    private userRepo;
    loginOrRegister(username: string): Promise<User>;
}

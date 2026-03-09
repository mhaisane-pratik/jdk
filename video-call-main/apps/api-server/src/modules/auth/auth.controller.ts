import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

login = async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const user = await this.service.loginOrRegister(username);

  // 🔥 VERY IMPORTANT
  res.json({
    id: user.id,
    username: user.username,
    company_id: user.companyId,
  });
};

}
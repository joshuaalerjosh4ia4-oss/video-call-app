import { JwtPayload } from "../utils/jwt";

// Augment Express's Request type so req.user is available after auth middleware.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};

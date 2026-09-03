import type { AuthTokenPayload } from "../modules/shared/utils/security.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

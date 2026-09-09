import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

router.get("/health", (req : Request, res : Response) => {
    res.status(200).json({ status: "ok", message: "Server is Healthy" });
});

export default router;
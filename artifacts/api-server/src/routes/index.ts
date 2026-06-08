import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import panelRouter from "./panel";
import authRouter from "./auth";
import filesRouter from "./files";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(panelRouter);
router.use("/bot", requireAuth, botRouter);
router.use("/files", filesRouter);

export default router;

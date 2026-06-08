import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import panelRouter from "./panel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(panelRouter);
router.use("/bot", botRouter);

export default router;

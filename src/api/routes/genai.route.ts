import { Router } from "express";
import { generateComponent } from "../controllers/genai.controller";

const router = Router();

// application route
router.post('/generate-component', generateComponent);

export default router;
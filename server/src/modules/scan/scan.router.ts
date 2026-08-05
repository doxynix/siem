import { zValidator } from "@hono/zod-validator";
import { type AuthEnv, requireAuth } from "@server/core/middleware/auth.middleware";
import { Hono } from "hono";
import { scanRequestSchema } from "./scan.schema";
import { scanLogContent } from "./scan.service";

export const scanRouter = new Hono<AuthEnv>()
  .use("*", requireAuth)
  .post("/", zValidator("json", scanRequestSchema), async (c) => {
    const { content, fileName } = c.req.valid("json");
    const result = await scanLogContent(content, fileName);
    return c.json(result, 200);
  });

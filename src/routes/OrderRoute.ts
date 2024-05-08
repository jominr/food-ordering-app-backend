import express from "express";
import { jwtCheck, jwtParse } from "../middleware/auth";
import OrderController from "../controllers/OrderController";

const router = express.Router();

router.get("/", jwtCheck, jwtParse, OrderController.getMyOrders)

// api/oder/
router.post(
  "/checkout/create-checkout-session",
  jwtCheck,
  jwtParse,
  OrderController.createCheckoutSession
);

// 捕捉stripe发送给我们的一个webhook event, 我们在这里处理
router.post("/checkout/webhook", OrderController.stripeWebhookHandler)

export default router;
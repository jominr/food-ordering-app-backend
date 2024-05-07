import express from "express";
import multer from "multer";
import MyRestaurantController from "../controllers/MyRestaurantController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyRestaurantRequest } from "../middleware/validation";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 *1024, // 5MB
  }
})

// /api/my/restaurant/order
router.get("/order", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurantOrders)

// 只改一部分
router.patch("/order/:orderId/status", jwtCheck, jwtParse, MyRestaurantController.updateOderStatus)

// /api/my/restaurant
router.get("/", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurant)
// /ap/my/restaurant
/* 
  2024.04.24
  我把upload.single("imageFile")放在validateMyRestaurantRequest的前面，
    validateMyRestaurantRequest就会报错，这是为什么呀?
  2024.04.25
  更新：反过来又报错了，eeee
 */
router.post(
  "/", 
  upload.single("imageFile"),
  validateMyRestaurantRequest,
  jwtCheck,
  jwtParse,
  MyRestaurantController.createMyRestaurant
);

router.put(
  "/", 
  upload.single("imageFile"),
  validateMyRestaurantRequest,
  jwtCheck,
  jwtParse,
  MyRestaurantController.updateMyRestaurant
)

export default router;
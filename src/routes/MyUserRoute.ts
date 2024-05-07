import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// /api/my/user,
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser);
// /api/my/user, 注册用户，要求要有来自auth0的token带回来
router.post(
  "/", 
  jwtCheck, 
  MyUserController.createCurrentUser
);

// /api/my/user, 更新用户数据，要求token要正确
router.put(
  "/", 
  jwtCheck, // has a valid access token
  jwtParse,  // get the user's information and check
  validateMyUserRequest, // validate the request body
  MyUserController.updateCurrentUser // update the user
);
export default router;


import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose"
import myUserRoute from "./routes/MyUserRoute";
// cloudinary package exports a V2 variable which is the version 2 of their API, 
import { v2 as cloudinary } from "cloudinary";
import myRestaurantRoute from "./routes/MyRestaurantRoute";
import restaurantRoute from "./routes/RestaurantRoute";
import orderRoute from "./routes/OrderRoute";

// typescript : as string
mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string)
.then(()=> console.log("Connected to database!"))

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
const app = express();

app.use(cors());

// stripe can verify that string in the request is valid 
// express.raw()用来解析request.body传参的
app.use("/api/order/checkout/webhook", express.raw({type: "*/*"}));

// add the middleware: convert the req.body to json
app.use(express.json()); 

app.get("/health", async (req: Request, res: Response)=> {
  res.json({ message: "health OK!" });
})

app.use("/api/my/user", myUserRoute);
app.use("/api/my/restaurant", myRestaurantRoute);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/order", orderRoute);

app.listen(7001, ()=>{
  console.log("server started on localhost: 7001")
})
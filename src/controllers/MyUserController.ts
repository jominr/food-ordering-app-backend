import { Request, Response } from "express";
import User from "../models/user";

const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // 记录数据库的方法 findOne, 为什么不用findById
    const currentUser = await User.findOne({ _id: req.userId });
    if (!currentUser) {
      // 记住这个return关键字
      return res.status(404).json({ message: "User not found "});
    }
    res.json(currentUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Somthing wen wrong" });
  }
}

const createCurrentUser = async (req: Request, res: Response) => {
  // 1. check if the user exists
  // 2. create the user if it doesn't exist 
  // 3. return the user object to the calling client
  try {
    // 记录数据库的方法：查找一条： User.findOne()
    const { auth0Id } = req.body;
    const existingUser = await User.findOne({ auth0Id });
    if (existingUser) {
      // 注意这里return, 下文不return
      return res.status(200).send();
    }
    // 记录数据库的方法：新增一条：new and save()
    const newUser = new User(req.body);
    await newUser.save();
    // 201 means created. and then pass back the new user
    res.status(201).json(newUser.toObject());

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user" });
  }
  
}

const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const { name, addressLine1, country, city } = req.body;
    // 记录数据库的方法：findById
    const user = await User.findById(req.userId);
    if (!user) {
      // 注意return
      return res.status(404).json({ message: "User not found" })
    }
    user.name = name;
    user.addressLine1 = addressLine1;
    user.city = city;
    user.country = country;
    // 记录数据库的方法：save() 用于数据库更新。
    await user.save();
    res.send(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating user" });
  }
}

export default {
  getCurrentUser,
  createCurrentUser,
  updateCurrentUser,
}
import Stripe from "stripe";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const getMyOrders = async (req: Request, res: Response) => {
  try {
    // add the restaurant and the user to the order object up here
    const orders = await Order.find({ user: req.userId })
    // 把这些reference信息也返回回来
      .populate("restaurant")
      .populate("user");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong "});
  }
}

type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: string,
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
  };
  restaurantId: string;
}

// webhook和http endpoint没有太大区别，不同点在于它是用来接收第三方系统的事件，
const stripeWebhookHandler = async (req: Request, res: Response) => {
  console.log("RECEIVED EVENT");
  let event; 
  try {
    const sig = req.headers["stripe-signature"];
    event = STRIPE.webhooks.constructEvent(
      req.body, 
      sig as string, 
      STRIPE_ENDPOINT_SECRET
    );
  } catch (error: any) {
    console.log(error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const order = await Order.findById(event.data.object.metadata?.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.totalAmount = event.data.object.amount_total;
    order.status = "paid";

    await order.save();
  }
  res.status(200).send();
};

// 要支付时创建的CheckoutSession，客户端跳转到这个url去支付。
const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;
    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    );
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const newOrder = new Order({
      restaurant: restaurant, // 这里是要填restaurantId, 还是填restaurant，不过数据库里存的是Id
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createAt: new Date(),
    })

    const lineItems = createLineItems(checkoutSessionRequest, restaurant.menuItems)

    const session = await createSession(
      lineItems, 
      newOrder._id.toString(),
      restaurant.deliveryPrice, 
      restaurant._id.toString()
    );

    if (!session.url) {
      throw res.status(500).json({ message: "Error creating stripe session"});
    }

    await newOrder.save();
    res.json({ url: session.url});

  } catch (error: any) {
    console.log(error);
    // stripe errors
    res.status(500).json({ message: error.raw.message })
  }
}
// geting the price from backend, more safe
const createLineItems = (checkoutSessionRequest: CheckoutSessionRequest, menuItems: MenuItemType[] ) => {
  // 1. foreach cartItem, get the menuItem object from the restaurant to get the price
  const lineItems = checkoutSessionRequest.cartItems.map((cartItem)=>{
    const menuItem = menuItems.find((item) => item._id.toString() === cartItem.menuItemId.toString());
    if(!menuItem) {
      throw new Error(`Menu item not found: ${cartItem.menuItemId}`)
    }

    // 2. foreach cartItem, convert it to a stripe line item
    const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "aud",
        unit_amount: menuItem.price,
        product_data: {
          name: menuItem.name,
        }
      },
      quantity: parseInt(cartItem.quantity),
    };
     // 3. return line item array
    return line_item;
  })

  return lineItems;
}

const createSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number, 
  restaurantId: string,
) => {
  const sessionData = await STRIPE.checkout.sessions.create({
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice,
            currency: "aud"
          }
        }
      }
    ],
    mode: "payment",
    metadata: {
      orderId,
      restaurantId,
    },
    success_url: `${FRONTEND_URL}/order-status?success=true`,
    cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
  });
  return sessionData;
};

export default { createCheckoutSession, stripeWebhookHandler, getMyOrders }
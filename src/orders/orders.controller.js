const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));
// assign id when necessary
const nextId = require("../utils/nextId");

function propertiesPresent(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    const value = data[propertyName];
    //     console.log(propertyName, value)
    if (value) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}
const deliverToPropertyPresent = propertiesPresent("deliverTo");
const mobileNumberPropertyPresent = propertiesPresent("mobileNumber");
const dishesPropertyPresent = propertiesPresent("dishes");

function orderHasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes.length <= 0 || !Array.isArray(dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  next();
}

//iterate  w/ for each or for loop
function dishQuantityPropertyPresent(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    let quantity = dishes[i].quantity;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.orderId = foundOrder;
    next();
  }
  next({ status: 404, message: `No matching order found: ${orderId}` });
}

function read(req, res, next) {
  const { orderId } = res.locals;
  res.json({ data: orderId });
}

function statusCheck(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "" || !status || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery,delivered",
    });
  }
  next();
}
function statusDelivered(req, res, next) {
  const { orderId } = res.locals;

  if (orderId.status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  }
  next();
}

function dataMatchCheck(req, res, next) {
  const { orderId } = res.locals;
  const { data: { id } = {} } = req.body;
  if (id === orderId.id || id === null || !id) {
    next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function update(req, res, next) {
  let { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  // change found order to request body properties
  let order = res.locals.orderId;
  let originalDeliverTo = order.deliverTo;
  let originalMobileNumber = order.mobileNumber;
  let originalStatus = order.status;
  let originalDishes = order.dishes;
  let originalQuantity = order.dishes.quantity;

  if (originalDeliverTo !== deliverTo) {
    originalDeliverTo = deliverTo;
  }
  if (originalMobileNumber !== mobileNumber) {
    originalMobileNumber = mobileNumber;
  }
  if (originalStatus !== status) {
    originalStatus = status;
  }
  if (originalDishes !== dishes) {
    originalDishes = dishes;
  }
  if (originalQuantity !== dishes.quantity) {
    originalQuantity = dishes.quantity;
  }

  res.json({
    data: { id: req.params.orderId, deliverTo, mobileNumber, status, dishes },
  });
}

function checkStatusForPending(req, res, next) {
  const orderId = res.locals.orderId;
  if (orderId.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex(
    (order) => Number(order.id) === Number(orderId)
  );
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res, next) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    deliverToPropertyPresent,
    mobileNumberPropertyPresent,
    dishesPropertyPresent,
    orderHasDishes,
    dishQuantityPropertyPresent,
    create,
  ],
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    deliverToPropertyPresent,
    mobileNumberPropertyPresent,
    dishesPropertyPresent,
    orderHasDishes,
    dishQuantityPropertyPresent,
    statusCheck,
    statusDelivered,
    dataMatchCheck,
    update,
  ],
  delete: [orderIdExists, checkStatusForPending, destroy],
  list,
};

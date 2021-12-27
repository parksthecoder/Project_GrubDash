const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// validate incomings request has a name key
function hasName(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    next();
  }
  next({ status: 400, message: "Dish must include a name" });
}

function hasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    next();
  }
  next({ status: 400, message: "Dish must include a description" });
}

function hasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price) {
    next();
  }
  next({ status: 400, message: "Dish must include a price" });
}

function priceIsRight(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price > 0) {
    next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function hasImageUrl(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    next();
  }
  next({ status: 400, message: "Dish must include a image_url" });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (!foundDish) {
    next({ status: 404, message: `Dish does not exist ${dishId}` });
  }
  res.locals.dish = foundDish;
  next();
}

function read(req, res, next) {
  res.status(200).json({ data: res.locals.dish });
}

function checkId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const dish = res.locals.dish;

  dish.id = id;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    hasName,
    hasDescription,
    hasPrice,
    priceIsRight,
    hasImageUrl,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    checkId,
    hasName,
    hasDescription,
    hasPrice,
    priceIsRight,
    hasImageUrl,
    update,
  ],
  list,
};

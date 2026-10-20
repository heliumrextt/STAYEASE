const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listings.js");

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stayease";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");

  await Listing.deleteMany({});
  await Listing.insertMany(initData.data);
  console.log("data was initialized");

  await mongoose.connection.close();
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
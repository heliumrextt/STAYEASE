
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: {
      type: String,
      default: "listingimage",
    },
    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },

  },

  price: Number,
  location: String,
  country: String,
  category: {
    type: String,
    enum: ["trending", "beachfront", "mountains", "villas", "pools", "cabins", "farms", "cities", "heritage", "budget"],
    default: "trending",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});


const listing = mongoose.model("listing", listingSchema);
module.exports = listing;
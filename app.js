const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listings.js");
const path = require("path");
const methodOverride = require("method-override");

const MONGO_URL = "mongodb://127.0.0.1:27017/stayease";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

const categoryInfo = {
  beachfront: {
    title: "Beachfront",
    emoji: "🏖️",
    tagline: "Wake up to waves, sand and sunsets.",
    gradient: "linear-gradient(135deg, #00c6ff, #0072ff)",


  },
  mountains: {
    title: "Mountains",
    emoji: "⛰️",
    tagline: "Cabins, chalets and peaceful hill escapes.",
    gradient: "linear-gradient(135deg, #5f7d95, #2c3e50)",
  },
  villas: {
    title: "Villas",
    emoji: "🏡",
    tagline: "Private luxury stays with space to spread out.",
    gradient: "linear-gradient(135deg, #f7971e, #ffd200)",
  },
  heritage: {
    title: "Heritage",
    emoji: "🏰",
    tagline: "Stay inside stories: castles, havelis and old townhouses.",
    gradient: "linear-gradient(135deg, #b24592, #f15f79)",
  },
};

//Category Page Route
app.get("/category/:name", async (req, res) => {
  const { name } = req.params;
  const info = categoryInfo[name];
  if (!info) return res.redirect("/listings");

  const listings = await Listing.find({ category: name });
  res.render("listings/category.ejs", { listings, category: name, info });
});
//Index Route
app.get("/listings", async (req, res) => {
  const { q, category } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings, category });
});


//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});


//Create Route
app.post("/listings", async (req, res) => {
  const { image, ...rest } = req.body.listing;
  const newListing = new Listing({
    ...rest,
    ...(image && { image: { url: image, filename: "listingimage" } }),
  });
  await newListing.save();
  res.redirect("/listings");
});

//Update Route
app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const { image, ...rest } = req.body.listing;
  await Listing.findByIdAndUpdate(id, {
    ...rest,
    ...(image && { image: { url: image, filename: "listingimage" } }),
  });
  res.redirect(`/listings/${id}`);
});

//Edit Route
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});



//Delete Route
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
});

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
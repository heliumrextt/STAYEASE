require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listings.js");
const path = require("path");
const methodOverride = require("method-override");

// --- Auth (Phase 1) ---
const session = require("express-session");
const MongoStoreModule = require("connect-mongo");
const MongoStore = MongoStoreModule.default || MongoStoreModule;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRoutes = require("./routes/users.js");
const { isLoggedIn, isOwner } = require("./middleware.js");

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stayease";

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
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// --- Session, flash, passport (must come before the routes) ---
const sessionOptions = {
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    touchAfter: 24 * 3600,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// available in every EJS file
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// signup / login / logout
app.use("/", userRoutes);

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

//New Route (login required)
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

//Create Route (login required, saves the owner)
app.post("/listings", isLoggedIn, async (req, res) => {
  const { image, ...rest } = req.body.listing;
  const newListing = new Listing({
    ...rest,
    ...(image && { image: { url: image, filename: "listingimage" } }),
  });
  newListing.owner = req.user._id;
  await newListing.save();
  req.flash("success", "New stay created!");
  res.redirect("/listings");
});

//Update Route (owner only)
app.put("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  const { image, ...rest } = req.body.listing;
  await Listing.findByIdAndUpdate(id, {
    ...rest,
    ...(image && { image: { url: image, filename: "listingimage" } }),
  });
  req.flash("success", "Stay updated!");
  res.redirect(`/listings/${id}`);
});

//Edit Route (owner only)
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

//Delete Route (owner only)
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Stay deleted.");
  res.redirect("/listings");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
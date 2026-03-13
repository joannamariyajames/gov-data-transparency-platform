const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const datasetRoutes = require("./routes/datasets");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/govdata", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use("/api/datasets", datasetRoutes);

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
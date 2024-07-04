/** @format */

const express = require("express");
const compression = require("compression");
const path = require("path");
const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "build")));

app.get("*", function (req, res) {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(express.static(__dirname + "/public"));

const PORT = process.env.PORT || 3102;

app.listen(PORT, () => {
	console.log(`App is running on port ${PORT}`);
});

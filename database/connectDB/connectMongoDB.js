module.exports = async function (uriConnect) {
	const mongoose = require("mongoose");
	const threadModel = require("../models/mongodb/thread.js");
	const userModel = require("../models/mongodb/user.js");
	const dashBoardModel = require("../models/mongodb/userDashBoard.js");
	const globalModel = require("../models/mongodb/global.js");
	const bankModel = require("../models/mongodb/bank.js"); // Ajout du modèle bank

	await mongoose.connect(uriConnect, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		bankModel // Retour du modèle bank
	};
};

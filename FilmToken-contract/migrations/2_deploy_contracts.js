var FilmToken = artifacts.require("FilmToken");

module.exports = function(deployer) {
    deployer.deploy(FilmToken);
};

const Token = {
    tokenId: 0,
    movieName: "",
    basePrice: 0,
    productionCompany: "",
    ownerAddr: "",
    minTime: 0,
    maxTime: 0,
    apprPercent: 0,
    deprPercent: 0,
    baseDays: 0,
    resale: false
}
let tokenList = [];

App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'https://sepolia.infura.io/v3/29cf43758f8a410da43d77301476813e',
    //chairPerson:null,
    currentAccount:null,
    init: function() {
        console.log("NON ANGJS");
        return App.initWeb3();
    },


    initWeb3: function() {
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            App.web3Provider = new Web3.providers.HttpProvider(App.url);
        }
        web3 = new Web3(App.web3Provider);

        ethereum.enable();

        App.populateAddress();
        return App.initContract();
    },

    initContract: function() {
        $.getJSON('FilmToken.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var filmArtifact = data;
            App.contracts.film = TruffleContract(filmArtifact);

            App.contracts.film.setProvider(App.web3Provider);

            return App.bindEvents();
        });
    },

    bindEvents: function() {
        $(document).on('click', '#fetchAll', function(){ App.getAllProdHouses(); });
        $(document).on('click', '#registerProd', function(){ var prodName = $('#prodName').val(); var prodAddr = $('#prodAddr').val(); App.registerProductionHouse(prodName, prodAddr); });
        $(document).on('click', '#tokenize', function(){
            var movieName = $('#movieName').val();
            var basePrice = $('#movieTokenValue').val();
            var baseDays = $('#baseDays').val();
            var apprPercent = $('#appreciationPercent').val()
            var deprPercent = $('#depreciationPercent').val()
            var minTime = $('#earliestReleaseDate').val()
            var maxTime = $('#finalReleaseDate').val()

            const valueInWei = BigInt(basePrice) * BigInt(10**18);
            console.log(basePrice);
            App.createMovieTokenJs(movieName, basePrice, baseDays,apprPercent, deprPercent,minTime, maxTime);
        });
        document.getElementById("clickUsers").onclick = App.viewTokens();
        // document.getElementById("myTokensClick").onclick = angularApp.viewMyTokens();



    },

    populateAddress : function(){
        new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
            web3.eth.defaultAccount=web3.eth.accounts[0]
            jQuery.each(accounts,function(i){
                if(web3.eth.coinbase != accounts[i]){
                    var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
                    jQuery('#enter_address').append(optionElement);
                }
            });
        });
    },


    registerProductionHouse : function(prodName, prodAddr) {
        console.log("Reg Prod House");
        console.log(web3.eth.accounts[0]);
        console.log(prodAddr);
        var filmInstance;
        App.contracts.film.deployed().then(function(instance) {
            filmInstance = instance;
            return filmInstance.registerProductionHouse(prodName, prodAddr, {from : web3.eth.accounts[0]});
        }).then(function(res){
            console.log(res);
            toastr.options.timeOut = 4000;

            var events = res.logs;
            toastr.options.timeOut = 4000;
            toastr.info(events[0].args.text + " "+events[0].args.prodName);

            toastr.success("Registered!");
        }).catch(function(err){
            console.log(err.message.value);
            toastr.options.timeOut = 4000;
            toastr.error(err.message);
            if(err.message.includes("Duplicate Production House")){
                toastr.error("Duplicate Production House");
            }else{
                toastr.error("Failed");
            }
        })
    },

    handleBuy : function(days, movieName, finalValue) {
        console.log("Buy token");
        console.log(days);
        console.log(movieName);
        console.log(finalValue);

        var filmInstance;
        App.contracts.film.deployed().then(function(instance) {

            filmInstance = instance;
            return filmInstance.buyMovieToken(days, movieName, {from : web3.eth.accounts[0], value: finalValue.toString()});
        }).then(function(res){
            console.log(res);
            toastr.options.timeOut = 4000;

            var events = res.logs;
            toastr.options.timeOut = 4000;
            toastr.info(events[0].args.text +" "+ events[0].args.name);
            toastr.success("Purchased!");
        }).catch(function(err){
            console.log(err.message);
            toastr.options.timeOut = 4000;
            if(err.message.includes("Resale is not allowed for this movie")){
                toastr.error("Resale is not allowed for this movie");
            }else{
                toastr.error("Failed");
            }

        })
    },

    enableDis : function (tokenId){
        App.contracts.film.deployed().then(function(instance) {
            filmInstance = instance;
            return filmInstance.enableOrDisableResale(tokenId, {from : web3.eth.accounts[0]});
        }).then(function(res){
            console.log(res);
            toastr.options.timeOut = 4000;
            toastr.success("Toggled!");
        }).catch(function(err){
            console.log(err.message);
            toastr.options.timeOut = 4000;
            toastr.error("Failed");
        })
    },

    incrDecr : function (tokenId, value, flag){
        if(flag==0){//decrease
            App.contracts.film.deployed().then(function(instance) {
                filmInstance = instance;
                return filmInstance.depreciateTokenValue(tokenId, value, {from : web3.eth.accounts[0]});
            }).then(function(res){
                console.log(res);
                toastr.options.timeOut = 4000;
                toastr.success("Decreased!");
            }).catch(function(err){
                console.log(err.message);
                toastr.options.timeOut = 4000;
                toastr.error("Failed");
            })
        } else {
            App.contracts.film.deployed().then(function (instance) {
                filmInstance = instance;
                return filmInstance.appreciateTokenValue(tokenId, value, {from: web3.eth.accounts[0]});
            }).then(function (res) {
                console.log(res);
                toastr.options.timeOut = 4000;
                toastr.success("Increased!");
            }).catch(function (err) {
                console.log(err.message);
                toastr.options.timeOut = 4000;
                toastr.error("Failed");
            })
        }

    },


    createMovieTokenJs : function(movieName, basePrice, baseDays,apprPercent, deprPercent,minTime, maxTime) {
        console.log("To check");
        var filmInstance;

        if(apprPercent<0 || deprPercent<0){
            alert("Invalid values");
            return;
        }
        App.contracts.film.deployed().then(function(instance) {
            filmInstance = instance;
            console.log(basePrice);
            console.log(apprPercent);
            return filmInstance.createMovieToken(movieName, basePrice,baseDays,minTime,maxTime,apprPercent,deprPercent,{from : web3.eth.accounts[0]} );
        }).then(function(res){
            console.log(res);
            var events = res.logs;
            toastr.options.timeOut = 4000;
            toastr.info(events[1].args.text +" " + events[1].args.name);
            toastr.success("Tokenized !");
        }).catch(function(err){
            console.log(err.message);
            if(err.message.includes("Not a registered production house")){
                toastr.error("Not a registered production house");
            }else{
                toastr.error("Failed");
            }
        })
    },

    getAllProdHouses : function (){
        App.contracts.film.deployed().then(function(instance) {
            filmInstance = instance;
            console.log("Entered Fetch");
            return filmInstance.getAllProdHouses();
        }).then(function(res){
            console.log(res);
            alert("fetch successful");
        }).catch(function(err){
            console.log(err.message);
        })
    },

    viewTokens : function() {
        tokenList = [];
        var filmInstance;
        console.log("view all the movies");
        var ids = 0;
        App.contracts.film.deployed().then(function(instance) {
            filmInstance = instance;
            return filmInstance.getAllTokenIds();
        }).then(function(res){
            // console.log(res);
            console.log(res.c[0]);
            ids = res.c[0];
            console.log("Token count fetched");
            return ids;
        }).then(function(res){

            console.log(res);
            var promises = [];
            for (var i=0;i<res;i++) {
                promises.push(filmInstance.tokenIdToTokenMap(i));
            }
            console.log("Token count fetched");
            // alert("all movies displayed");
            return Promise.all(promises);
        }).then(function(res){
            console.log("Final block");
            console.log(res);
            for(let i=0;i<res.length;i++){
                var tempToken = {
                    movieName: res[i][0],
                    tokenId: res[i][1].c[0],
                    basePrice: res[i][2].c[0],
                    productionCompany: res[i][3],
                    ownerAddr: res[i][4],
                    minTime: res[i][5].c[0],
                    maxTime: res[i][6].c[0],
                    apprPercent: res[i][7].c[0],
                    deprPercent: res[i][8].c[0],
                    baseDays: res[i][9].c[0],
                    resale: res[i][10]
                };
                tokenList.push(tempToken);

            }
            angular.element(document.querySelector('[ng-controller="myCtrl"]')).scope().copyData(tokenList, web3.eth.accounts[0].toString()) ;
            // angular.element(document.querySelector('[ng-controller="myCtrl"]')).scope().copyMyTokens(tokenList) ;
        }).catch(function(err){
            console.log(err)
            console.log(err.message);
        })

    },





};

var angularApp = angular.module('myApp', []);
angularApp.controller('myCtrl', function($scope) {
    console.log("ANGJS");

    $scope.some = "Fetch";
    $scope.tokens = [];
    $scope.myTokenList=[];
    $scope.tokens.push($scope.tempToken);
    $scope.copyData = function(data,address){
        $scope.tokens = data;
        console.log($scope.tokens.length);

        for(var i=0;i<$scope.tokens.length;i++){
            console.log($scope.tokens[i]);
            console.log(address);
            if($scope.tokens[i].ownerAddr === address)
                $scope.myTokenList.push($scope.tokens[i]);
        }
        $scope.$apply();// to reflect this change in the view
    }

    $scope.increaseDecrease = function(tokenId, value, flag){
        console.log("inside incr decr");
        console.log(tokenId);
        console.log(value);
        App.incrDecr(tokenId, value, flag);
    }

    $scope.enableDisable = function(tokenId,resale){
        App.enableDis(tokenId, resale);
    }


    //alone function
    $scope.buyToken = function (days, movieName, baseDays, minDays, maxDays, baseVal, apprPercent, deprPercent){

        let finalValue = BigInt(baseVal) * BigInt(10**18);
        if(days == baseDays){
            finalValue = BigInt(baseVal) * BigInt(10**18); // do nothing case
        }else if(days>=minDays && days<baseDays ){//highest cost
            finalValue += (finalValue/ BigInt(apprPercent));
        }else if(days>baseDays && days<=maxDays){//second least
            finalValue -= (finalValue/ BigInt(deprPercent));
        }else if(days>maxDays){//least most
            finalValue -= (finalValue/ BigInt(deprPercent));
            finalValue -= (finalValue/ BigInt(deprPercent));

        }
        console.log(days);
        console.log(movieName);
        console.log(finalValue);
        App.handleBuy(days, movieName, finalValue);
    }




});


$(function() {
    $(window).load(function() {
        App.init();
    });
});

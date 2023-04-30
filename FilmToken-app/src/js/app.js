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
    url: 'http://127.0.0.1:7545',
    //chairPerson:null,
    currentAccount:null,
    init: function() {
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
            var voteArtifact = data;
            App.contracts.vote = TruffleContract(voteArtifact);
            // console.log(App.contracts.vote);

            // Set the provider for our contract
            App.contracts.vote.setProvider(App.web3Provider);

            // App.getChairperson();
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
            // const struct = {
            //     movieName : ad,
            //     basePrice : parseInt(basePrice),
            //     baseDays : parseInt(baseDays),
            //     minTime : parseInt(ad4),
            //     maxTime : parseInt(ad5),
            //     apprPercent : parseInt(ad2),
            //     deprPercent : parseInt(ad3),
            //     resale : true
            // }
            App.createMovieTokenJs(movieName, basePrice, baseDays,apprPercent, deprPercent,minTime, maxTime);
        });
        $(document).on('click', '#view', function(){
            App.viewTokens()
        });

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
        App.contracts.vote.deployed().then(function(instance) {
            filmInstance = instance;
            return filmInstance.registerProductionHouse(prodName, prodAddr, {from : web3.eth.accounts[0]});
        }).then(function(res){
            console.log(res);
            alert("registered");
        }).catch(function(err){
            console.log(err.message);
        })
    },



    createMovieTokenJs : function(movieName, basePrice, baseDays,apprPercent, deprPercent,minTime, maxTime) {
        console.log("To check");
        var voteInstance;
        // if(minTime>maxTime || minTime<0 || maxTime<0){
        //     alert("Invalid values");
        //     return;
        // }
        // if(apprPercent<0 || deprPercent<0){
        //     alert("Invalid values");
        //     return;
        // }
        App.contracts.vote.deployed().then(function(instance) {
            voteInstance = instance;
            console.log(basePrice);
            console.log(apprPercent);
            return voteInstance.createMovieToken(movieName, basePrice,baseDays,minTime,maxTime,apprPercent,deprPercent );
        }).then(function(res){
            console.log(res);
            alert("tokenized");
        }).catch(function(err){
            console.log(err.message);
        })
    },

    getAllProdHouses : function (){
        App.contracts.vote.deployed().then(function(instance) {
            voteInstance = instance;
            console.log("Entered Fetch");
            return voteInstance.getAllProdHouses();
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
        App.contracts.vote.deployed().then(function(instance) {
            filmInstance = instance;
            return filmInstance.getAllTokenIds();
        }).then(function(res){
            // console.log(res);
            console.log(res.c[0]);
            ids = res.c[0];
            console.log("Token count fetched");
            return ids;
        }).then(function(res){
            // console.log(res);
            console.log(res);
            var promises = [];
            for (var i=0;i<res;i++) {
                promises.push(filmInstance.tokenIdToTokenMap(i));
            }
            console.log("Token count fetched");
            alert("all movies displayed");
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
                App.displayTokens();


                // console.log(res[i][0]);// MovieName
                // console.log(res[i][1].c[0]);
                // console.log(res[i][2].c[0]);
                // console.log(res[i][3]);
                // console.log(res[i][4]);
                // console.log(res[i][5].c[0]);
                // console.log(res[i][6].c[0]);
                // console.log(res[i][7].c[0]);
                // console.log(res[i][8].c[0]);
                // console.log(res[i][9].c[0]);


            }

        }).catch(function(err){
            console.log(err)
            console.log(err.message);
        })

    },


    displayTokens: function() {
        var $tokens = $("#displayList");
        $tokens.empty();
        for (var i = 0; i < tokenList.length; i++) {
            var $newTokenRow = $("<tr>");
            $newTokenRow.append("<td>" + tokenList[i].tokenId + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].movieName + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].basePrice + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].productionCompany + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].ownerAddr + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].minTime + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].maxTime + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].apprPercent + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].deprPercent + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].baseDays + "</td>");
            $newTokenRow.append("<td>" + tokenList[i].resale + "</td>");
            $tokens.append($newTokenRow);
        }
    }

};


$(function() {
    $(window).load(function() {
        App.init();
    });
});

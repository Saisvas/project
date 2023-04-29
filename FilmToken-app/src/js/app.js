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
            var ad = $('#movieName').val(); 
            var ad1 = $('#movieTokenValue').val();
            var baseDays = $('#baseDays').val();
            var ad2 = $('#appreciationPercent').val()
            var ad3 = $('#depriciationPercent').val()
            var ad4 = $('#earliestReleaseDate').val()
            var ad5 = $('#finalReleaseDate').val()
                // [ "RRR",   0,  0.1,  "dvv", "0xaF0f99add34234830D377141e2FA29Fd13aaAdAC",  2,  7, 3, 5,  true ]
            const struct = {
                movieName : ad,
                tokenId : 1,//
                basePrice : parseInt(ad1),
                baseDays : parseInt(baseDays),
                productionCompany : "dvvent",
                ownerAddr : "0xaF0f99add34234830D377141e2FA29Fd13aaAdAC" ,
                minTime : parseInt(ad4),
                maxTime : parseInt(ad5),
                apprPercent : parseInt(ad2),
                deprPercent : parseInt(ad3),
                resale : true
            }
            console.log(struct)
            App.createMovieToken(ad, struct); 
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



    createMovieToken : function(ad, struct) {
        console.log("To check");
        var voteInstance;
        if(struct.minTime>struct.maxTime || struct.minTime<0 || struct.maxTime<0){
            alert("Invalid values");
            return;
        }
        if(struct.apprPercent>struct.maxTime || struct.minTime<0 || struct.maxTime<0){
            alert("Invalid values");
            return;
        }
        App.contracts.vote.deployed().then(function(instance) {
            voteInstance = instance;
            console.log(struct.basePrice);
            console.log(struct.apprPercent);
            return voteInstance.createMovieToken(ad, parseInt(struct.basePrice),parseInt(struct.baseDays), parseInt(struct.minTime),parseInt(struct.maxTime), parseInt(struct.apprPercent), parseInt(struct.deprPercent));
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
    }
};


$(function() {
    $(window).load(function() {
        App.init();
    });
});

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
        $(document).on('click', '#register', function(){ var ad = $('#name').val(); var ad1 = $('#address').val(); App.registerProductionHouse(ad, ad1); });
        $(document).on('click', '#tokenize', function(){ 
            var ad = $('#movieName').val(); 
            var ad1 = $('#movieTokenValue').val();
            var ad2 = $('#appreciationPercent').val()
            var ad3 = $('#depriciationPercent').val()
            var ad4 = $('#earliestReleaseDate').val()
            var ad5 = $('#finalReleaseDate').val()
                // [ "RRR",   0,  0.1,  "dvv", "0xaF0f99add34234830D377141e2FA29Fd13aaAdAC",  2,  7, 3, 5,  true ]
            const struct = {
                movieName : ad,
                tokenId : 1,//
                basePrice : parseInt(ad1),
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


    registerProductionHouse : function(x, y) {
        console.log("To check");
        var voteInstance;
        App.contracts.vote.deployed().then(function(instance) {
            voteInstance = instance;
            return voteInstance.registerProductionHouse(x, y);
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
        App.contracts.vote.deployed().then(function(instance) {
            voteInstance = instance;
            return voteInstance.createMovieToken(ad, struct);
        }).then(function(res){
            console.log(res);
            alert("tokenized");
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

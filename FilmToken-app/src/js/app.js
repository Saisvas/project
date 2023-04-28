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
        $(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.doSomething(ad); });
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
            return voteInstance.doSomething(x);
        }).then(function(res){
            console.log(res);
            alert(App.names[res] + "  is the winner ! :)");
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

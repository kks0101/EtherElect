App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
      // Request account access
        await window.ethereum.enable();
      } catch (error) {
      // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election){
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);
      App.listenForEvents();
      return App.render();
    });
  },

  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function(){
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    web3.eth.getCoinbase(function(err, account){
      if(err === null){
        App.account = account;
        $("#accountAddress").html("Your account: " + account);
      }
    });

    App.contracts.Election.deployed().then(function(instance){
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount){
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();
      for(var i = 1; i<= candidatesCount;i++){
        electionInstance.candidates(i).then(function(candidate){
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];


          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td>";
          candidatesResults.append(candidateTemplate);

          var candidateOption = "<option value ='" + id + "'>" + name + "</option>";
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted){
      if(hasVoted){
        $('form').hide();
      }
      loader.hide();
      content.show();

    }).catch(function(error){
      console.warn(error);
    })
  },

  castVote: function(){
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance){
      return instance.vote(candidateId,  {from: App.account});
    }).then(function(result){
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err){
      console.error(err);
    });
  }
};
  

$(function() {
  $(window).load(function() {
    App.init();
  });
});

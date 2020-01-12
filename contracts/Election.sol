pragma solidity ^0.5;

contract Election{
	
	struct Candidate{
		uint id;
		string name;
		uint voteCount;
	}
	mapping(uint=> Candidate) public candidates;
	mapping(address => bool) public voters;
	//set the duration for which the election is valid
	//use format -- a days + b months + c hours + d minutes + e seconds
	uint private duration = 2 minutes;

	//total time for which election is valid
	uint public expiryTime = now + duration;
	uint public candidatesCount;
	
	event votedEvent(
		uint indexed _candidateId
	);

	constructor() public{
		addCandidate("Candidate 1");
		addCandidate("Candidate 2");
	}

	function addCandidate(string memory _name ) private{
		candidatesCount ++;
		candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
	}

	function vote(uint _candidateId) public {
		
		require(!voters[msg.sender]);
		
		require(_candidateId>0 && _candidateId<=candidatesCount);

		voters[msg.sender] = true;

		candidates[_candidateId].voteCount ++;

		emit votedEvent(_candidateId);

	}
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MovieToken is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter public tokenIds;

    struct Token {
        string movieName;
        uint256 tokenId;
        uint basePrice;
        string productionCompany;
        address payable ownerAddr;
        uint minTime;
        uint maxTime;
        uint apprPercent;
        uint deprPercent;
        uint baseDays;

        bool resale;
    }

    Token[] allTokens;
    address public admin;
    mapping(uint256 => Token) public tokenIdToTokenMap;
    mapping(address=>string) productionAddrToNameMap;
    mapping(string=>uint) nameTokenIdMap;
    mapping(uint=>address) tokenIdToOwnerMap;

    modifier duplicateProdHouse (address addr){
        bool duplicate = bytes(productionAddrToNameMap[addr]).length > 0 ;
        require(!duplicate,"Duplicate Production House");
        _;
    }

    modifier onlyAdmin{
        require(msg.sender == admin,"Not an Admin, no access");
        _;
    }

    modifier validProdHouse(address addr){
        bool duplicate = bytes(productionAddrToNameMap[addr]).length > 0 ;
        require(duplicate,"Not a registered production house");
        _;
    }

    modifier duplicateMovieToken(string memory name){ // self exp.
        bool duplicate = false;
        for(uint i=0;i<allTokens.length;i++){

            if(keccak256(abi.encodePacked(allTokens[i].movieName)) == keccak256(abi.encodePacked(name))){
                duplicate = true;break;
            }
        }

        require(!duplicate,"A token is already present for this movie");
        _;
    }

    modifier validMovieToken(string memory name){ // self exp.
        bool duplicate = false;
        for(uint i=0;i<allTokens.length;i++){

            if(keccak256(abi.encodePacked(allTokens[i].movieName)) == keccak256(abi.encodePacked(name))){
                duplicate = true;break;
            }
        }

        require(duplicate,"A token is not present for this movie");
        _;
    }

    modifier validMinMaxValues(uint min,uint max){ // min (both days and appr/depr, should be +ve
        require(min<=max && min>0 && max>0,"Invalid Min Max values");
        _;
    }

    modifier checkTokenOwner(uint tokenId){
        require(tokenIdToOwnerMap[tokenId]==msg.sender,"Not the owner of the token");
        _;
    }

    constructor() ERC721("MovieTokenization","MVTK"){
        admin = msg.sender;
    }

    function registerProductionHouse(string memory name,address addr) public duplicateProdHouse(msg.sender) onlyAdmin{
        productionAddrToNameMap[addr] = name;
    }
    // uint appr, uint depr,uint minTime,uint maxTime, uint baseValue)

    // function createMovieToken(string memory movieName, Token memory input) public validProdHouse(msg.sender) duplicateMovieToken(movieName) validMinMaxValues(input.minTime,input.maxTime) validMinMaxValues(input.apprPercent,input.deprPercent){
    //     //check if the user is a registerd prod house or not, handled in validProdHouse modifier
    //     //check for duplicate token
    //     // string memory prodName = productionAddrToNameMap[msg.sender];
    //     //check if input values are valid
    //     // address payable sender = payable(msg.sender);
    //     Token memory newToken = Token(movieName,tokenIds.current(),input.basePrice,productionAddrToNameMap[msg.sender],payable(msg.sender),input.minTime,input.maxTime,input.apprPercent,input.deprPercent,true);

    //     nameTokenIdMap[movieName] = tokenIds.current();
    //     tokenIdToTokenMap[tokenIds.current()] = newToken;
    //     tokenIdToOwnerMap[tokenIds.current()] = msg.sender;
    //     _safeMint(msg.sender, tokenIds.current());
    //     tokenIds.increment();
    //     allTokens.push(newToken);


    // }

    function createMovieToken(string memory movieName, uint basePrice,uint baseDays, uint minTime,uint maxTime,uint apprPercent,uint deprPercent) public validProdHouse(msg.sender) duplicateMovieToken(movieName){
        //check if the user is a registerd prod house or not, handled in validProdHouse modifier
        //check for duplicate token
        // string memory prodName = productionAddrToNameMap[msg.sender];
        //check if input values are valid
        // address payable sender = payable(msg.sender);
        Token memory newToken = Token(movieName,tokenIds.current(),basePrice,productionAddrToNameMap[msg.sender],payable(msg.sender),minTime,maxTime,apprPercent,deprPercent,baseDays,true);

        nameTokenIdMap[movieName] = tokenIds.current();
        tokenIdToTokenMap[tokenIds.current()] = newToken;
        tokenIdToOwnerMap[tokenIds.current()] = msg.sender;
        _safeMint(msg.sender, tokenIds.current());
        tokenIds.increment();
        allTokens.push(newToken);


    }

    function buyMovieToken(uint dayss, string memory movieName) public payable validMovieToken(movieName){ //changed tokenId to movieName, as there's no visibility provided right now
        //check if the movieName is valid, in modifier
        //days can be +/-, - represents earlier, + later
        uint tokenId = nameTokenIdMap[movieName];
        Token memory token = tokenIdToTokenMap[tokenId];
        require(token.resale == true, "Resale is not allowed for this movie");
        uint value = token.basePrice;
        uint minDays = token.minTime;
        uint maxDays = token.maxTime;
        uint baseDays = token.baseDays;

        uint finalValue = value;// case where dayss == baseDays


        if(dayss > minDays && dayss < (minDays+ baseDays) / 2 ){ //highest cost
            finalValue += finalValue * (token.apprPercent/100);
            finalValue += finalValue * (token.apprPercent/100);
        }else if(dayss>=(baseDays+dayss)/2 && dayss<baseDays ){//2nd highest
            finalValue += finalValue * (token.apprPercent/100);
        }else if(dayss>baseDays && dayss<=(baseDays+maxDays)/2){//second least
            finalValue -= finalValue * (token.apprPercent/100);
        }else if(dayss>(baseDays+maxDays)/2){//least most
            finalValue -= finalValue * (token.apprPercent/100);
            finalValue -= finalValue * (token.apprPercent/100);
        }



        //get token owner and transfer ether
        token.ownerAddr.transfer(msg.value); // failure of this reverts everything needn't explicitly handle for now, TODO: better, give a proper error message

        //change ownership
        token.ownerAddr = payable(msg.sender);
        //also in map
        tokenIdToOwnerMap[tokenId] = msg.sender;
        //disable resale
        token.resale  = false;
        //change in token list
        for(uint i=0;i<allTokens.length;i++){
            if(allTokens[i].tokenId == tokenId){
                allTokens[i].ownerAddr = payable(msg.sender);
            }
        }

    }


    function appreciateTokenValue(uint256 tokenId, uint value) public checkTokenOwner(tokenId){ //how will the user know tokenid, remember? give him visibility
        tokenIdToTokenMap[tokenId].basePrice += value;
    }

    function depreciateTokenValue(uint256 tokenId, uint value) public checkTokenOwner(tokenId){
        tokenIdToTokenMap[tokenId].basePrice -=  value;
    }

    function enableOrDisableResale(uint tokenId) public checkTokenOwner(tokenId){
        if(tokenIdToTokenMap[tokenId].resale == true){
            tokenIdToTokenMap[tokenId].resale = false;
        }else{
            tokenIdToTokenMap[tokenId].resale = true;
        }
    }


    function viewTokens() public view returns(Token[] memory){

        Token[] memory result = new Token[](allTokens.length);
        uint index = 0;
        for(uint i=0;i<=tokenIds.current();i++){ // no support to deleting tokens, so looping through all tokenids is equal to keys

            if(tokenIdToTokenMap[i].ownerAddr == msg.sender){
                result[index++]=tokenIdToTokenMap[i];
            }
        }
        return result;
    }

}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC721Transfer {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC20Transfer {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title ArenaMarketplace
 * @notice Peer-to-peer marketplace for ArenaFighter NFTs on Base.
 *         Sellers list fighters for $ARENA; buyers purchase with a protocol fee.
 */
contract ArenaMarketplace is Ownable, ReentrancyGuard {

    struct Listing {
        address seller;
        uint256 price;
        bool    active;
    }

    IERC721Transfer public immutable fighterNFT;
    IERC20Transfer  public immutable arenaCoin;
    address         public treasury;
    uint16          public feeBps = 250;

    // tokenId → Listing
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Delisted(uint256 indexed tokenId);
    event Sold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor(address _fighter, address _arena, address _treasury)
        Ownable(msg.sender)
    {
        fighterNFT = IERC721Transfer(_fighter);
        arenaCoin  = IERC20Transfer(_arena);
        treasury   = _treasury;
    }

    function list(uint256 tokenId, uint256 price) external {
        require(fighterNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price=0");
        require(!listings[tokenId].active, "Active");
        require(
            fighterNFT.getApproved(tokenId) == address(this) ||
            fighterNFT.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );
        listings[tokenId] = Listing(msg.sender, price, true);
        emit Listed(tokenId, msg.sender, price);
    }

    function delist(uint256 tokenId) external {
        Listing storage l = listings[tokenId];
        require(l.active, "Not active");
        require(l.seller == msg.sender || owner() == msg.sender, "Unauthorized");
        l.active = false;
        emit Delisted(tokenId);
    }

    function buy(uint256 tokenId) external nonReentrant {
        Listing storage l = listings[tokenId];
        require(l.active, "Not active");
        require(msg.sender != l.seller, "Own listing");
        l.active = false;

        uint256 fee    = (l.price * feeBps) / 10_000;
        uint256 seller = l.price - fee;

        require(arenaCoin.transferFrom(msg.sender, l.seller, seller), "Pay seller");
        if (fee > 0) require(arenaCoin.transferFrom(msg.sender, treasury, fee), "Pay fee");
        fighterNFT.transferFrom(l.seller, msg.sender, tokenId);

        emit Sold(tokenId, msg.sender, l.price);
    }

    function setFeeBps(uint16 bps) external onlyOwner { require(bps <= 1000); feeBps = bps; }
    function setTreasury(address t) external onlyOwner { require(t != address(0)); treasury = t; }
}

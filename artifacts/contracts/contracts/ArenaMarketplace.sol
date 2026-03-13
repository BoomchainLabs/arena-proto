// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IArenaCoin {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title ArenaMarketplace
 * @notice Peer-to-peer marketplace for ArenaFighter NFTs.
 *         Sellers list fighters at a fixed $ARENA price; buyers purchase them.
 *         A configurable fee (default 2.5%) goes to the protocol treasury.
 */
contract ArenaMarketplace is Ownable, ReentrancyGuard {

    // ─── Types ─────────────────────────────────────────────────────────────────

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;   // in $ARENA (18 decimals)
        bool    active;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    IERC721    public fighterNFT;
    IArenaCoin public arenaCoin;

    address public treasury;

    // Fee in basis points (100 = 1 %, 250 = 2.5 %)
    uint256 public feeBps = 250;

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    // tokenId → active listingId (0 = not listed)
    mapping(uint256 => uint256) public activeListingByToken;

    // ─── Events ────────────────────────────────────────────────────────────────

    event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event Delisted(uint256 indexed listingId, uint256 indexed tokenId);
    event Sold(uint256 indexed listingId, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event FeeUpdated(uint256 newFeeBps);
    event TreasuryUpdated(address newTreasury);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _fighterNFT, address _arenaCoin, address _treasury)
        Ownable(msg.sender)
    {
        fighterNFT = IERC721(_fighterNFT);
        arenaCoin  = IArenaCoin(_arenaCoin);
        treasury   = _treasury;
    }

    // ─── Seller actions ────────────────────────────────────────────────────────

    /**
     * @notice List a fighter NFT for sale.
     * @param tokenId The fighter's tokenId.
     * @param price   Sale price in $ARENA (wei).
     */
    function list(uint256 tokenId, uint256 price) external returns (uint256 listingId) {
        require(fighterNFT.ownerOf(tokenId) == msg.sender, "Not your fighter");
        require(price > 0, "Price must be > 0");
        require(
            fighterNFT.getApproved(tokenId) == address(this) ||
            fighterNFT.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        require(activeListingByToken[tokenId] == 0, "Already listed");

        listingId = ++listingCount;
        listings[listingId] = Listing({
            seller:  msg.sender,
            tokenId: tokenId,
            price:   price,
            active:  true
        });
        activeListingByToken[tokenId] = listingId;

        emit Listed(listingId, msg.sender, tokenId, price);
    }

    /**
     * @notice Cancel a listing.
     */
    function delist(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(l.seller == msg.sender || owner() == msg.sender, "Unauthorized");

        l.active = false;
        activeListingByToken[l.tokenId] = 0;

        emit Delisted(listingId, l.tokenId);
    }

    // ─── Buyer actions ─────────────────────────────────────────────────────────

    /**
     * @notice Purchase a listed fighter.
     */
    function buy(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(msg.sender != l.seller, "Cannot buy own listing");

        l.active = false;
        activeListingByToken[l.tokenId] = 0;

        uint256 fee           = (l.price * feeBps) / 10_000;
        uint256 sellerAmount  = l.price - fee;

        // Transfer $ARENA from buyer → seller and treasury
        require(arenaCoin.transferFrom(msg.sender, l.seller, sellerAmount), "ARENA payment failed");
        if (fee > 0) {
            require(arenaCoin.transferFrom(msg.sender, treasury, fee), "ARENA fee failed");
        }

        // Transfer NFT from seller → buyer
        fighterNFT.transferFrom(l.seller, msg.sender, l.tokenId);

        emit Sold(listingId, msg.sender, l.tokenId, l.price);
    }

    // ─── Owner admin ───────────────────────────────────────────────────────────

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max 10%");
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
}

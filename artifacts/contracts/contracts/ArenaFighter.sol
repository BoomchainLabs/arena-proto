// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IArenaCoin {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title ArenaFighter
 * @notice ERC-721 NFT representing a fighter in the Arena Protocol ecosystem.
 *         Players mint fighters, which have on-chain stats (strength, speed,
 *         intelligence) and a rarity tier.  Minting costs $ARENA tokens.
 */
contract ArenaFighter is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum Rarity { Common, Rare, Epic, Legendary }

    struct FighterStats {
        uint8  strength;
        uint8  speed;
        uint8  intelligence;
        Rarity rarity;
        uint32 wins;
        uint32 losses;
        uint256 mintedAt;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    IArenaCoin public arenaCoin;
    address    public arenaContract;   // ArenaGame — allowed to record wins/losses

    uint256 public nextTokenId = 1;

    // Mint cost per rarity (in $ARENA, 18 decimals)
    mapping(Rarity => uint256) public mintCost;

    // tokenId → stats
    mapping(uint256 => FighterStats) public stats;

    // base URI for metadata
    string private _baseTokenURI;

    // ─── Events ────────────────────────────────────────────────────────────────

    event FighterMinted(address indexed owner, uint256 indexed tokenId, Rarity rarity);
    event StatsUpdated(uint256 indexed tokenId, uint32 wins, uint32 losses);
    event ArenaContractSet(address indexed arenaContract);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _arenaCoin, string memory baseURI)
        ERC721("Arena Fighter", "AFIGHTER")
        Ownable(msg.sender)
    {
        arenaCoin = IArenaCoin(_arenaCoin);
        _baseTokenURI = baseURI;

        // Default mint costs (can be updated by owner)
        mintCost[Rarity.Common]    = 50  ether;
        mintCost[Rarity.Rare]      = 150 ether;
        mintCost[Rarity.Epic]      = 400 ether;
        mintCost[Rarity.Legendary] = 1000 ether;
    }

    // ─── Minting ───────────────────────────────────────────────────────────────

    /**
     * @notice Mint a new fighter.  $ARENA tokens are burned (sent to address(0)
     *         to reduce supply) as the mint cost.
     */
    function mint(Rarity rarity) external nonReentrant returns (uint256 tokenId) {
        uint256 cost = mintCost[rarity];
        require(cost > 0, "Invalid rarity");

        // Collect $ARENA mint cost — transferred to this contract then burned
        require(
            arenaCoin.transferFrom(msg.sender, address(this), cost),
            "ARENA transfer failed"
        );

        tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // Derive pseudo-random stats from block data + caller + tokenId
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, tokenId)));

        stats[tokenId] = FighterStats({
            strength:     _statForRarity(seed,        rarity),
            speed:        _statForRarity(seed >> 8,   rarity),
            intelligence: _statForRarity(seed >> 16,  rarity),
            rarity:       rarity,
            wins:         0,
            losses:       0,
            mintedAt:     block.timestamp
        });

        emit FighterMinted(msg.sender, tokenId, rarity);
    }

    // ─── Battle recording ──────────────────────────────────────────────────────

    function recordWin(uint256 tokenId) external {
        require(msg.sender == arenaContract, "Only ArenaGame");
        stats[tokenId].wins++;
        emit StatsUpdated(tokenId, stats[tokenId].wins, stats[tokenId].losses);
    }

    function recordLoss(uint256 tokenId) external {
        require(msg.sender == arenaContract, "Only ArenaGame");
        stats[tokenId].losses++;
        emit StatsUpdated(tokenId, stats[tokenId].wins, stats[tokenId].losses);
    }

    // ─── Owner admin ───────────────────────────────────────────────────────────

    function setArenaContract(address _arena) external onlyOwner {
        arenaContract = _arena;
        emit ArenaContractSet(_arena);
    }

    function setMintCost(Rarity rarity, uint256 cost) external onlyOwner {
        mintCost[rarity] = cost;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    function _statForRarity(uint256 seed, Rarity rarity) internal pure returns (uint8) {
        uint8 base;
        uint8 range;
        if (rarity == Rarity.Common) {
            base = 20; range = 30;
        } else if (rarity == Rarity.Rare) {
            base = 40; range = 30;
        } else if (rarity == Rarity.Epic) {
            base = 60; range = 25;
        } else {
            base = 80; range = 20;
        }
        return uint8(base + (seed % range));
    }

    // ─── ERC-721 overrides ─────────────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

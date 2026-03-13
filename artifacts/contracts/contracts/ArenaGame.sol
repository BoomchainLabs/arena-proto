// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IArenaFighter {
    function ownerOf(uint256 tokenId) external view returns (address);
    function recordWin(uint256 tokenId) external;
    function recordLoss(uint256 tokenId) external;
    struct FighterStats {
        uint8  strength;
        uint8  speed;
        uint8  intelligence;
        uint8  rarity;
        uint32 wins;
        uint32 losses;
        uint256 mintedAt;
    }
    function stats(uint256 tokenId) external view returns (
        uint8  strength,
        uint8  speed,
        uint8  intelligence,
        uint8  rarity,
        uint32 wins,
        uint32 losses,
        uint256 mintedAt
    );
}

interface IArenaCoin {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ArenaGame
 * @notice On-chain battle resolution for the Arena Protocol.
 *         Players challenge each other (or PvE) and the contract
 *         deterministically resolves the outcome based on fighter stats,
 *         then distributes $ARENA rewards.
 */
contract ArenaGame is Ownable, ReentrancyGuard {

    // ─── Types ─────────────────────────────────────────────────────────────────

    enum BattleMode { PvE, PvP }
    enum Outcome    { AttackerWon, DefenderWon }

    struct Battle {
        uint256 attackerTokenId;
        uint256 defenderTokenId;
        address attacker;
        address defender;
        BattleMode mode;
        Outcome outcome;
        uint256 reward;
        uint256 timestamp;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    IArenaFighter public fighterNFT;
    IArenaCoin    public arenaCoin;

    uint256 public battleCount;
    mapping(uint256 => Battle) public battles;

    // Rewards (in $ARENA, 18 decimals)
    uint256 public pveWinReward  = 10 ether;
    uint256 public pvpWinReward  = 25 ether;

    // Cooldown between battles per fighter (seconds)
    uint256 public battleCooldown = 1 hours;
    mapping(uint256 => uint256) public lastBattleTime;

    // ─── Events ────────────────────────────────────────────────────────────────

    event BattleResolved(
        uint256 indexed battleId,
        uint256 indexed attackerTokenId,
        uint256 indexed defenderTokenId,
        Outcome outcome,
        uint256 reward
    );

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _fighterNFT, address _arenaCoin)
        Ownable(msg.sender)
    {
        fighterNFT = IArenaFighter(_fighterNFT);
        arenaCoin  = IArenaCoin(_arenaCoin);
    }

    // ─── Battle ────────────────────────────────────────────────────────────────

    /**
     * @notice Initiate a PvE battle.  Attacker fights an AI opponent.
     * @param attackerTokenId The tokenId of the attacking fighter.
     */
    function battlePvE(uint256 attackerTokenId) external nonReentrant returns (uint256 battleId) {
        require(fighterNFT.ownerOf(attackerTokenId) == msg.sender, "Not your fighter");
        _requireCooldown(attackerTokenId);

        (uint8 str, uint8 spd, uint8 intel,,,,) = fighterNFT.stats(attackerTokenId);
        uint256 attackerPower = uint256(str) + uint256(spd) + uint256(intel);

        // PvE enemy power: pseudo-random between 100-199
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, attackerTokenId, battleCount)));
        uint256 enemyPower = 100 + (seed % 100);

        Outcome outcome;
        uint256 reward;

        if (attackerPower >= enemyPower) {
            outcome = Outcome.AttackerWon;
            reward  = pveWinReward;
            fighterNFT.recordWin(attackerTokenId);
            _safeTransferReward(msg.sender, reward);
        } else {
            outcome = Outcome.DefenderWon;
            reward  = 0;
            fighterNFT.recordLoss(attackerTokenId);
        }

        lastBattleTime[attackerTokenId] = block.timestamp;
        battleId = ++battleCount;
        battles[battleId] = Battle({
            attackerTokenId: attackerTokenId,
            defenderTokenId: 0,
            attacker:        msg.sender,
            defender:        address(0),
            mode:            BattleMode.PvE,
            outcome:         outcome,
            reward:          reward,
            timestamp:       block.timestamp
        });

        emit BattleResolved(battleId, attackerTokenId, 0, outcome, reward);
    }

    /**
     * @notice Initiate a PvP battle.
     * @param attackerTokenId Attacker's fighter tokenId.
     * @param defenderTokenId Defender's fighter tokenId.
     */
    function battlePvP(uint256 attackerTokenId, uint256 defenderTokenId)
        external nonReentrant returns (uint256 battleId)
    {
        require(fighterNFT.ownerOf(attackerTokenId) == msg.sender, "Not your fighter");
        require(attackerTokenId != defenderTokenId, "Same fighter");
        _requireCooldown(attackerTokenId);

        address defenderAddr = fighterNFT.ownerOf(defenderTokenId);

        (uint8 aStr, uint8 aSpd, uint8 aInt,,,,) = fighterNFT.stats(attackerTokenId);
        (uint8 dStr, uint8 dSpd, uint8 dInt,,,,) = fighterNFT.stats(defenderTokenId);

        uint256 attackerPower = uint256(aStr) + uint256(aSpd) + uint256(aInt);
        uint256 defenderPower = uint256(dStr) + uint256(dSpd) + uint256(dInt);

        // Tie-break via pseudo-random seed
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, attackerTokenId, defenderTokenId)));
        if (attackerPower == defenderPower) {
            attackerPower += seed % 10;
        }

        Outcome outcome;
        uint256 reward;

        if (attackerPower > defenderPower) {
            outcome = Outcome.AttackerWon;
            reward  = pvpWinReward;
            fighterNFT.recordWin(attackerTokenId);
            fighterNFT.recordLoss(defenderTokenId);
            _safeTransferReward(msg.sender, reward);
        } else {
            outcome = Outcome.DefenderWon;
            reward  = pvpWinReward;
            fighterNFT.recordLoss(attackerTokenId);
            fighterNFT.recordWin(defenderTokenId);
            _safeTransferReward(defenderAddr, reward);
        }

        lastBattleTime[attackerTokenId] = block.timestamp;
        battleId = ++battleCount;
        battles[battleId] = Battle({
            attackerTokenId: attackerTokenId,
            defenderTokenId: defenderTokenId,
            attacker:        msg.sender,
            defender:        defenderAddr,
            mode:            BattleMode.PvP,
            outcome:         outcome,
            reward:          reward,
            timestamp:       block.timestamp
        });

        emit BattleResolved(battleId, attackerTokenId, defenderTokenId, outcome, reward);
    }

    // ─── Owner admin ───────────────────────────────────────────────────────────

    function setPveWinReward(uint256 reward) external onlyOwner { pveWinReward = reward; }
    function setPvpWinReward(uint256 reward) external onlyOwner { pvpWinReward = reward; }
    function setBattleCooldown(uint256 cooldown) external onlyOwner { battleCooldown = cooldown; }

    // ─── Internals ─────────────────────────────────────────────────────────────

    function _requireCooldown(uint256 tokenId) internal view {
        require(
            block.timestamp >= lastBattleTime[tokenId] + battleCooldown,
            "Fighter cooling down"
        );
    }

    function _safeTransferReward(address to, uint256 amount) internal {
        uint256 bal = arenaCoin.balanceOf(address(this));
        if (bal >= amount) {
            arenaCoin.transfer(to, amount);
        }
    }
}

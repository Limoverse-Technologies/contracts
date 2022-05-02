// contracts/Staking.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is Ownable, AccessControl {
    // Token used for staking
    ERC20 stakingToken;
    uint256 private _totalSupply;
    uint256 private _totalRewardSupply;
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    event AddStaking(address owner, uint256 amount, uint256 releaseTime);
    event PushStakingReward(uint256 amount);

    struct Stake {
        uint256 releaseTime;
        uint256 amount;
        bool exists;
    }

    mapping (address => Stake) private stakes;
    mapping (address => bool) private stakesInserted;
    mapping (address => uint256) private twoXRewards;
    mapping (address => uint256) private _balances;

    address[] private stakeHolders;

    /**
    * @dev Modifier that checks that this contract can transfer tokens from the
    *  balance in the stakingToken contract for the given address.
    */
    modifier canTransfer(address _address, uint256 _amount) {
        require(
        stakingToken.transferFrom(_address, address(this), _amount),
        "Stake required");

        _;
    }

    /**
    * @dev Constructor function
    * @param _stakingToken ERC20 The address of the token contract used for staking
    */
    constructor(ERC20 _stakingToken){
        stakingToken = _stakingToken;
    }

    function createStake(
        address _address,
        uint256 _amount,
        uint256 _releaseTime
      )
        internal
        canTransfer(msg.sender, _amount)
      {
        require(_amount > 0, "amount not valid");
        Stake storage _stake = stakes[_address];
        if(!stakesInserted[_address]){
            stakesInserted[_address] = true;
            stakeHolders.push(_address);
        }
        if(_releaseTime > 0){
            require(_releaseTime > _stake.releaseTime, "release time not valid");
            _stake.releaseTime = _releaseTime;
        }
        _totalSupply += _amount;
        _stake.amount += _amount;
        emit AddStaking(_address, _amount, _releaseTime);
      }

    function createTwoXReward(
        address _address,
        uint256 _amount
    ) external onlyRole(CREATOR_ROLE) {
        require(_amount > 0, "amount not valid");
        twoXRewards[_address] += _amount;
        _totalRewardSupply += _amount;
    }

    function stake(
        uint256 _amount
    ) external {
        createStake(msg.sender, _amount, 0);
    }

    function stakeFor(
        address _address,
        uint256 _amount,
        uint256 _releaseTime
    ) external {
        createStake(_address, _amount, _releaseTime);
    }

    function unStake(
        uint256 _amount
    ) external {
        
    }

    function pushStakingRewards(
        uint256 _amount
    ) external
    canTransfer(msg.sender, _amount)
    {
        uint256 totalHolding = _totalSupply + _totalRewardSupply;
        for (uint i = 0; i < stakeHolders.length; i++) {
            uint256 totalUserHolding = stakes[stakeHolders[i]].amount + twoXRewards[stakeHolders[i]];
            uint256 pecentage = totalHolding * totalUserHolding / 100;
            uint256 _reward = _amount * pecentage / 100;
            _balances[stakeHolders[i]] += _reward;
        }
        emit PushStakingReward(_amount);
    }

    function claimReward() external {
        require(_balances[msg.sender] > 0, "no balance for claim");
        require(
            stakingToken.transferFrom(address(this), msg.sender, _balances[msg.sender]),
            "reward transfer failed");
    }
}
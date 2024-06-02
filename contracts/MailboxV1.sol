// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MailboxV1 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public version;
    mapping(address => string) internal messages;

    event MessageSent(address indexed sender, string message);
    event MessageReceived(address indexed recipient, string message);

    function initialize() public initializer {
        __Ownable_init();
        version = 1;
    }

    function sendMessage(address recipient, string memory message) public {
        require(recipient != address(0), "Invalid recipient");
        messages[recipient] = message;
        emit MessageSent(msg.sender, message);
    }

    function getMessage() public view returns (string memory) {
        return messages[msg.sender];
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}

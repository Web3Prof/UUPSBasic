// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MailboxV1.sol";

contract MailboxV2 is MailboxV1 {
    function reinitialize() public reinitializer(2) {
        version = 2;
    }

    function forwardMessage(address recipient) public {
        require(
            bytes(messages[msg.sender]).length > 0,
            "No message to forward"
        );
        string memory message = messages[msg.sender];
        // delete messages[msg.sender]; // uncomment if you want to delete the message after forwarding
        messages[recipient] = message;
        emit MessageReceived(recipient, message);
    }
}

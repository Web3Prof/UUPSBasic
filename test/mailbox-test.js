const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Mailbox Upgradeable", () => {
    let mailboxProxy;
    let mailboxProxyAddress;
    let implementationAddress;
    let deployer;
    let messenger1;
    let messenger2;
    let messenger3;

    beforeEach(async () => {
        [deployer, messenger1, messenger2, messenger3] = await ethers.getSigners();

        const MailboxFactory = await ethers.getContractFactory("MailboxV1");
        mailboxProxy
            = await upgrades.deployProxy(MailboxFactory);

        mailboxProxyAddress = await mailboxProxy.getAddress();
        implementationAddress = await upgrades.erc1967.getImplementationAddress(mailboxProxyAddress);
    });

    it("should successfully deploy", async () => {
        // console.log("Mailbox Proxy: " + mailboxProxyAddress);
        // console.log("Implementation: " + implementationAddress);
        console.log("Version: " + await mailboxProxy.version());
        assert.ok(mailboxProxyAddress);
        assert.ok(implementationAddress);
    });

    it("should allow sending and retrieving messages in V1", async function () {
        await mailboxProxy.connect(messenger1).sendMessage(messenger2.address, "Hello from V1");
        // console.log("Message 1: ", await mailboxProxy.connect(messenger2).getMessage());
        expect(await mailboxProxy.connect(messenger2).getMessage()).to.equal("Hello from V1");
    });

    it("should upgrade to V2 and keep state from V1", async () => {
        mailboxProxyAddress = await mailboxProxy.getAddress();
        implementationAddress = await upgrades.erc1967.getImplementationAddress(mailboxProxyAddress);

        await mailboxProxy.connect(messenger1).sendMessage(messenger2.address, "Hello from V1");
        // console.log("Message 1: ", await mailboxProxy.connect(messenger2).getMessage());

        const MailboxV2Factory = await ethers.getContractFactory("MailboxV2");
        let upgrade = await upgrades.upgradeProxy(mailboxProxyAddress, MailboxV2Factory);
        await upgrade.reinitialize();
        const proxyAddrCheck = await upgrade.getAddress();

        const implementationAddressV2 = await upgrades.erc1967.getImplementationAddress(mailboxProxyAddress);;
        // proxy should stay the same, but implementation should be upgraded
        expect(mailboxProxyAddress).to.equal(proxyAddrCheck);
        expect(implementationAddress).to.not.equal(implementationAddressV2);
        console.log("Version: " + await mailboxProxy.version());

        // data state should stay the same
        expect(await mailboxProxy.connect(messenger2).getMessage()).to.equal("Hello from V1");

    });

    it("should forward messages in V2", async function () {
        MailboxV2 = await ethers.getContractFactory("MailboxV2");
        mailboxProxy = await upgrades.upgradeProxy(mailboxProxyAddress, MailboxV2);
        await mailboxProxy.reinitialize();

        // Send a message with V2
        await mailboxProxy.connect(messenger1).sendMessage(messenger2.address, "Hello from V2");
        expect(await mailboxProxy.connect(messenger2).getMessage()).to.equal("Hello from V2");

        // Forward the message
        await mailboxProxy.connect(messenger2).forwardMessage(messenger3.address);
        expect(await mailboxProxy.connect(messenger3).getMessage()).to.equal("Hello from V2");
    });

    it("should revert if initialized twice", async function () {
        await expect(mailboxProxy.initialize()).to.be.revertedWith("Initializable: contract is already initialized");
    });
});
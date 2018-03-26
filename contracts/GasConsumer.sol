pragma solidity 0.4.19;


/**
 * @title GasConsumer
 * @dev GasReducer contract consumes gas for gas usage tests.
 * @author Dominik Kroliczek (http://github.com/kruligh)
 */
contract GasConsumer {

    uint256[] data;

    function GasConsumer() public {
        //init data, otherwise first calls aveStorage consume extra initialization gas
        data.push(1);
    }

    function doNothing() public {

    }

    function saveStorage(uint256 count) public {
        for(uint i = 0; i<count; i++){
            data.push(1);
        }
    }

}
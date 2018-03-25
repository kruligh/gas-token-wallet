pragma solidity 0.4.19;


/**
 * @title GasConsumer
 * @dev GasReducer contract consumes gas for gas usage tests.
 * @author Dominik Kroliczek (http://github.com/kruligh)
 */
contract GasConsumer {

    uint256[] data;

    function GasConsumer() public {
        //todo consider this init, is it required??
        //probably init data, so calling saveStorage should consume constant gas/save usage, including first call
        data.push(1);
    }

    function saveStorage(uint256 count) public {
        for(uint i = 0; i<count; i++){
            data.push(1);
        }
    }

}
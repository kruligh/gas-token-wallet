pragma solidity 0.4.19;

contract GST2 {

}

/**
 * @title GasReducer
 * @dev GasReducer contract allows to..
 * @author Dominik Kroliczek (http://github.com/kruligh)
 */
contract GasReducer {
    GST2 public gst2;

    function GasReducer(GST2 _gst2) public {
        gst2 = _gst2;
    }

}

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

/**
 * @dev Decentralize exchange for fundgible and non-fundgible tokens powered by atomic swaps. 
 */
contract Exchange {
  
  /**
   * @dev Structure representing what to send and where.
   * @param token Address of the token we are sending (can be ERC20 or ERC721).
   * @param tokenType Type od the token we are sending: 0 - ERC20, 1 - ERC721.
   * @param from Address of the sender.
   * @param to Address of the receiver.
   * @param value Amount of ERC20 or ID of ERC721.
   */
  struct TransferData 
  {
    address token;
    int16 tokenType;
    address from;
    address to;
    address value;
  }

  /**
   * @dev Structure representing the signature parts.
   * @param r ECDSA signature parameter r.
   * @param s ECDSA signature parameter s.
   * @param v ECDSA signature parameter v.
   */
  struct SignatureData
  {
    bytes32 r;
    bytes32 s;
    uint8 v;
  }

  /**
   * @dev Structure representing the data needed to do the swap.
   * @param maker Address of the one that made the claim.
   * @param taker Address of the one that is executing the claim.
   * @param transfer Data of all the transfers that should accure it this swap.
   * @param signature Data from the signed claim.
   * @param seed Arbitrary number to facilitate uniqueness of the order's hash. Usually timestamp.
   * @param expirationTimestamp Timestamp of when the claim expires. 0 if indefinet. 
   */
  struct SwapData 
  {
    address maker;
    address taker;
    TransferData[] transfers;
    SignatureData signature;
    uint256 seed;
    uint256 expirationTimestamp;
  }
  
  constructor () 
    public
  {

  }
}
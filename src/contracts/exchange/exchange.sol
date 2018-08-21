pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../proxy/token-transfer-proxy.sol";
import "../proxy/nftokens-transfer-proxy.sol";

/**
 * @dev Decentralize exchange for fundgible and non-fundgible tokens powered by atomic swaps. 
 */
contract Exchange 
{
  /**
   * @dev Error constants.
   */
  string constant INVALID_SIGNATURE_KIND = "1001";
  string constant INVALID_TOKEN_TRANSFER_PROXY = "1002";
  string constant INVALID_NF_TOKEN_TRANSFER_PROXY = "1003";

  /**
   * @dev Enum of available signature kinds.
   * @param eth_sign Signature using eth sign.
   * @param trezor Signature from Trezor hardware wallet.
   * It differs from web3.eth_sign in the encoding of message length
   * (Bitcoin varint encoding vs ascii-decimal, the latter is not
   * self-terminating which leads to ambiguities).
   * See also:
   * https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
   * https://github.com/trezor/trezor-mcu/blob/master/firmware/ethereum.c#L602
   * https://github.com/trezor/trezor-mcu/blob/master/firmware/crypto.c#L36 
   * @param eip721 Signature using eip721.
   */
  enum SignatureKind
  {
    eth_sign,
    trezor,
    eip712
  }
  
  /**
   * @dev Enum of available tokens kinds.
   * @param erc20 ERC20 standard tokens.
   * @param erc721 ERC721 standard tokens.
   */
  enum TokenKind
  {
    erc20,
    erc721
  }

  /**
   * @dev Structure representing what to send and where.
   * @param token Address of the token we are sending (can be ERC20 or ERC721).
   * @param kind Type of the token we are sending
   * @param from Address of the sender.
   * @param to Address of the receiver.
   * @param value Amount of ERC20 or ID of ERC721.
   */
  struct TransferData 
  {
    address token;
    TokenKind kind; // Check other options like ERC165 or checking methods that exists.
    address from;
    address to;
    uint256 value;
  }

  /**
   * @dev Structure representing the signature parts.
   * @param r ECDSA signature parameter r.
   * @param s ECDSA signature parameter s.
   * @param v ECDSA signature parameter v.
   * @param kind Type of signature. 
   */
  struct SignatureData
  {
    bytes32 r;
    bytes32 s;
    uint8 v;
    SignatureKind kind;
  }

  /**
   * @dev Structure representing the data needed to do the swap.
   * @param maker Address of the one that made the claim.
   * @param taker Address of the one that is executing the claim.
   * @param transfers Data of all the transfers that should accure it this swap.
   * @param signature Data from the signed claim.
   * @param seed Arbitrary number to facilitate uniqueness of the order's hash. Usually timestamp.
   * @param expiration Timestamp of when the claim expires. 0 if indefinet. 
   */
  struct SwapData 
  {
    address maker;
    address taker;
    TransferData[] transfers;
    uint256 seed;
    uint256 expiration;
  }

  /** 
   * @dev Proxy contract addresses.
   */
  address public tokenTransferProxy; 
  address public nfTokenTransferProxy; 

  /**
   * @dev Sets Token proxy address and NFT Proxy address.
   * @param _tokenTransferProxy Address pointing to TokenTransferProxy contract.
   * @param _nfTokenTransferProxy Address pointing to NFTokenTransferProxy contract.
   */
  constructor (
    address _tokenTransferProxy, 
    address _nfTokenTransferProxy
  ) 
    public
  {
    require(_tokenTransferProxy != address(0), INVALID_TOKEN_TRANSFER_PROXY);
    require(_nfTokenTransferProxy != address(0), INVALID_NF_TOKEN_TRANSFER_PROXY);

    tokenTransferProxy = _tokenTransferProxy;
    nfTokenTransferProxy = _nfTokenTransferProxy;
  }

  /**
   * @dev Calculates keccak-256 hash of SwapData from parameters.
   * @param _swapData Data needed for atomic swap.
   * @return keccak-hash of swap data.
   */
  function getSwapDataClaim(
    SwapData _swapData
  )
    public
    view
    returns (bytes32)
  {
    bytes memory temp;

    for(uint256 i = 0; i < _swapData.transfers.length; i++)
    {
      temp = abi.encodePacked(
        temp,
        _swapData.transfers[i].token,
        _swapData.transfers[i].kind,
        _swapData.transfers[i].from,
        _swapData.transfers[i].to,
        _swapData.transfers[i].value
      );
    }

    return keccak256(
      abi.encodePacked(
        address(this),
        _swapData.maker,
        _swapData.taker,
        temp,
        _swapData.seed,
        _swapData.expiration
      )
    );
  }
  
  /**
   * @dev Verifies if claim signature is valid.
   * @param _signer address of signer.
   * @param _claim Signed Keccak-256 hash.
   * @param _signature Signature data.
   */
  function isValidSignature(
    address _signer,
    bytes32 _claim,
    SignatureData _signature
  )
    public
    pure
    returns (bool)
  {
    if(_signature.kind == SignatureKind.eth_sign)
    {
      return _signer == ecrecover(
        keccak256(
          abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            _claim
          )
        ),
        _signature.v,
        _signature.r,
        _signature.s
      );
    } else if (_signature.kind == SignatureKind.trezor)
    {
      return _signer == ecrecover(
        keccak256(
          abi.encodePacked(
            "\x19Ethereum Signed Message:\n\x20",
            _claim
          )
        ),
        _signature.v,
        _signature.r,
        _signature.s
      );
    } else if (_signature.kind == SignatureKind.eip712)
    {
      return _signer == ecrecover(
        _claim,
        _signature.v,
        _signature.r,
        _signature.s
      );
    }

    revert(INVALID_SIGNATURE_KIND);
  }

  /** 
   * @dev Transfers ERC20 tokens via TokenTransferProxy using transferFrom function.
   * @param _token Address of token to transferFrom.
   * @param _from Address transfering token.
   * @param _to Address receiving token.
   * @param _value Amount of token to transfer.
   */
  function _transferViaTokenTransferProxy(
    address _token,
    address _from,
    address _to,
    uint _value
  )
    internal
    returns (bool)
  {
    return TokenTransferProxy(tokenTransferProxy).transferFrom(
      _token,
      _from,
      _to,
      _value
    );
  }

  /**
   * @dev Transfers NFToken via NFTokenProxy using transferFrom function.
   * @param _nfToken Address of NFToken to transfer.
   * @param _from Address sending NFToken.
   * @param _to Address receiving NFToken.
   * @param _id Id of transfering NFToken.
   */
  function _transferViaNFTokenTransferProxy(
    address _nfToken,
    address _from,
    address _to,
    uint256 _id
  )
    internal
  {
    NFTokenTransferProxy(nfTokenTransferProxy)
      .transferFrom(_nfToken, _from, _to, _id);
  }
}
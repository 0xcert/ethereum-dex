pragma solidity ^0.4.24;


import "@0xcert/ethereum-utils/contracts/math/SafeMath.sol";
import "@0xcert/ethereum-utils/contracts/utils/SupportsInterface.sol";
import "@0xcert/ethereum-erc721/contracts/tokens/ERC721.sol";
import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "./TokenTransferProxy.sol";
import "./NFTokenTransferProxy.sol";

/*
 * @dev based on: https://github.com/0xProject/contracts/blob/master/contracts/Exchange.sol
 */
contract Swapper is SupportsInterface {

  using SafeMath for uint256;

  /*
   * @dev Enum of possible errors.
   */
  enum Errors {
    SWAP_ALREADY_PERFORMED, // Transfer has already beed performed.
    SWAP_CANCELLED, // Transfer was cancelled.
    INSUFFICIENT_BALANCE_OR_ALLOWANCE, // Insufficient balance or allowance for ZXC transfer.
    NFTOKEN_NOT_ALLOWED // Proxy does not have the permission to transfer all the NFTokens.
  }

  /*
   * @dev contract addresses
   */
  address TOKEN_CONTRACT;
  address TOKEN_TRANSFER_PROXY_CONTRACT;
  address NFTOKEN_TRANSFER_PROXY_CONTRACT;

  /*
   * @dev Changes to state require at least 5000 gas.
   */
  uint16 constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;

  /*
   * @dev Mapping of all cancelled transfers.
   */
  mapping(bytes32 => bool) public swapCancelled;

  /*
   * @dev Mapping of all performed transfers.
   */
  mapping(bytes32 => bool) public swapPerformed;


  /*
   * @dev This event emmits when NFToken changes ownership.
   */
  event PerformSwap(address indexed _from,
                    address _to,
                    bytes32 _swapClaim);


  /*
   * @dev This event emmits when NFToken transfer order is cancelled.
   */
  event CancelSwap(address indexed _from,
                   address _to,
                   bytes32 _swapClaim);


  /*
   * @dev Structure of data needed for a swap.
   */
  struct SwapData{
    address from;
    address to;
    address[] nfTokensFrom;
    uint256[] idsFrom;
    address[] nfTokensTo;
    uint256[] idsTo;
    address[] feeAddresses;
    uint256[] feeAmounts;
    uint256 seed;
    uint256 expirationTimestamp;
    bytes32 claim;
  }

  /*
   * @dev Sets ZXC token address, Token Proxy address and NFToken Proxy address.
   * @param _zxcToken Address pointing to ZXC Token contract.
   * @param _tokenTransferProxy Address pointing to TokenTransferProxy contract.
   * @param _nfTokenTransferProxy Address pointing to none-fungible token transfer proxy contract.
   */
  constructor(address _zxcToken,
              address _tokenTransferProxy,
              address _nfTokenTransferProxy)
    public
  {
    TOKEN_CONTRACT = _zxcToken;
    TOKEN_TRANSFER_PROXY_CONTRACT = _tokenTransferProxy;
    NFTOKEN_TRANSFER_PROXY_CONTRACT = _nfTokenTransferProxy;
    supportedInterfaces[0xe20524dd] = true; // Swapper
  }

  /*
   * @dev Get the address of the fee token used in swaps.
   */
  function getTokenAddress()
    external
    view
    returns (address)
  {
    return TOKEN_CONTRACT;
  }

  /*
   * @dev Get the address of the token transfer proxy used in swaps.
   */
  function getTokenTransferProxyAddress()
    external
    view
    returns (address)
  {
    return TOKEN_TRANSFER_PROXY_CONTRACT;
  }

  /*
   * @dev Get the address of the non-fungible token transfer proxy used in swaps.
   */
  function getNFTokenTransferProxyAddress()
    external
    view
    returns (address)
  {
    return NFTOKEN_TRANSFER_PROXY_CONTRACT;
  }

  /*
   * @dev Performs the NFToken(s) swap.
   *
   * @param _addresses Array of all addresses that the following index structure:
   *   0: Address of NFToken swap maker.
   *   1: Address of NFToken taker.
   *   2..N: Slice of NFToken contract addresses for each NFToken ID that belongs to the maker.
   *   N+1..M: Slice of NFToken contract addresses for each NFToken ID that belongs to the taker.
   *   M+1..Z: Slice of addresses to whom the taker has to pay fees.
   * @param _uints Array of all uints that has the following index structure:
   *   0: _seed Timestamp that represents the salt
   *   1: Timestamp of when the transfer claim expires
   *   2: Number of tokens to transfer from maker to taker.
   *   3: Number of tokens to transfer from taker to maker.
   *   4..N: Slice of IDs that maker is sending.
   *   N+1..M: Slice of IDs that taker is sending.
   *   M+1..Z: Slice of fee amounts that have to be paid.
   * @param _v ECDSA signature parameter v.
   * @param _r ECDSA signature parameters r.
   * @param _s ECDSA signature parameters s.
   * @param _throwIfNotSwappable Test the swap before performing.
   * @return Success of the swap.
   */
  function performSwap(address[] _addresses,
                       uint256[] _uints,
                       uint8 _v,
                       bytes32 _r,
                       bytes32 _s,
                       bool _throwIfNotSwappable)
    public
  {
    require(_addresses.length.add(2) == _uints.length);
    require(_uints[2] > 0);
    require(_uints[3] > 0);

    SwapData memory swapData = SwapData({
      from: _addresses[0],
      to: _addresses[1],
      nfTokensFrom: _getAddressSubArrayTo(_addresses, 2, _uints[2].add(2)),
      idsFrom: _getUintSubArrayTo(_uints, 4, _uints[2].add(4)),
      nfTokensTo: _getAddressSubArrayTo(_addresses, _uints[2].add(2), (_uints[2].add(2)).add(_uints[3])),
      idsTo: _getUintSubArrayTo(_uints, _uints[2].add(4), (_uints[2].add(4)).add(_uints[3])),
      feeAddresses: _getAddressSubArrayTo(_addresses, (_uints[2].add(2)).add(_uints[3]), _addresses.length),
      feeAmounts: _getUintSubArrayTo(_uints,(_uints[2].add(4)).add(_uints[3]), _uints.length),
      seed: _uints[0],
      expirationTimestamp: _uints[1],
      claim: getSwapDataClaim(
        _addresses,
        _uints
      )
    });

    require(swapData.to == msg.sender);
    require(swapData.from != swapData.to);
    require(swapData.expirationTimestamp >= now);

    require(isValidSignature(
      swapData.from,
      swapData.claim,
      _v,
      _r,
      _s
    ));

    require(!swapPerformed[swapData.claim], "Swap already performed.");
    require(!swapCancelled[swapData.claim], "Swap cancelled.");

    if (_throwIfNotSwappable)
    {
      require(_canPayFee(swapData.to, swapData.feeAmounts), "Insufficient balance or allowance.");
      require(_areTransfersAllowed(swapData), "NFToken transfer not approved");
    }

    swapPerformed[swapData.claim] = true;

    _makeNFTokenTransfers(swapData);

    _payfeeAmounts(swapData.feeAddresses, swapData.feeAmounts, swapData.to);

    emit PerformSwap(
      swapData.from,
      swapData.to,
      swapData.claim
    );
  }

  /*
   * @dev Cancels NFToken transfer.
   *
   * @param _addresses Array of all addresses that go as following: 0 = Address of NFToken swap
   * maker, 1 = Address of NFToken taker, then an array of NFToken contract addresses for every
   * NFToken id of the maker, after an array of NFToken contract addresses for every NFToken id of
   * the taker, and array of addresses to whom the taker has to pay fees.
   * @param _uints Array of all uints that go as following: 0 = _seed Timestamp that represents the
   * salt, 1 = Timestamp of when the transfer claim expires, 2 = numbers of tokens to transfer from
   * maker to taker, 3 = numbers of tokens to transfer from taker to maker, then an Array of ids
   * that maker is sending, array of ids that taker is sending, array of fee amounts that have to be
   * paid.
   */
  function cancelSwap(address[] _addresses,
                      uint256[] _uints)
    public
  {
    require(msg.sender == _addresses[0]);

    bytes32 claim = getSwapDataClaim(
      _addresses,
      _uints
    );

    require(!swapPerformed[claim]);

    emit CancelSwap(
      _addresses[0],
      _addresses[1],
      claim
    );
  }

  /*
   * @dev Calculates keccak-256 hlaim of mint data from parameters.
   * @param _addresses Array of all addresses that go as following: 0 = Address of NFToken swap
   * maker, 1 = Address of NFToken taker, then an array of NFToken contract addresses for every
   * NFToken id of the maker, after an array of NFToken contract addresses for every NFToken id of
   * the taker, and array of addresses to whom the taker has to pay fees.
   * @param _uints Array of all uints that go as following: 0 = _seed Timestamp that represents the
   * salt, 1 = Timestamp of when the transfer claim expires, 2 = numbers of tokens to transfer from
   * maker to taker, 3 = numbers of tokens to transfer from taker to maker, then an Array of ids
   * that maker is sending, array of ids that taker is sending, array of fee amounts that have to be
   * paid.
   * @returns keccak-hash of transfer data.
   */
  function getSwapDataClaim(address[] _addresses,
                            uint256[] _uints)
    public
    constant
    returns (bytes32)
  {
    return keccak256(
      abi.encodePacked(
        address(this),
        _addresses[0],
        _addresses[1],
        _getAddressSubArrayTo(_addresses, 2, _uints[2].add(2)),
        _getUintSubArrayTo(_uints, 4, _uints[2].add(4)),
        _getAddressSubArrayTo(_addresses, _uints[2].add(2), (_uints[2].add(2)).add(_uints[3])),
        _getUintSubArrayTo(_uints, _uints[2].add(4), (_uints[2].add(4)).add(_uints[3])),
        _getAddressSubArrayTo(_addresses, (_uints[2].add(2)).add(_uints[3]), _addresses.length),
        _getUintSubArrayTo(_uints,(_uints[2].add(4)).add(_uints[3]), _uints.length),
        _uints[0],
        _uints[1]
      )
    );
  }

  /*
   * @dev Verifies if NFToken signature is valid.
   * @param _signer address of signer.
   * @param _claim Signed Keccak-256 hash.
   * @param _v ECDSA signature parameter v.
   * @param _r ECDSA signature parameters r.
   * @param _s ECDSA signature parameters s.
   * @return Validity of signature.
   */
  function isValidSignature(address _signer,
                            bytes32 _claim,
                            uint8 _v,
                            bytes32 _r,
                            bytes32 _s)
    public
    pure
    returns (bool)
  {
    return _signer == ecrecover(
      keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _claim)),
      _v,
      _r,
      _s
    );
  }

  /*
   * @dev Check is payer can pay the feeAmounts.
   * @param _to Address of the payer.
   * @param_ feeAmounts All the feeAmounts to be payed.
   * @return Confirmation if feeAmounts can be payed.
   */
  function _canPayFee(address _to,
                      uint256[] _feeAmounts)
    internal
    returns (bool)
  {
    uint256 feeAmountsum = 0;

    for(uint256 i; i < _feeAmounts.length; i++)
    {
      feeAmountsum = feeAmountsum.add(_feeAmounts[i]);
    }

    if(_getBalance(TOKEN_CONTRACT, _to) < feeAmountsum
      || _getAllowance(TOKEN_CONTRACT, _to) < feeAmountsum )
    {
      return false;
    }
    return true;
  }

  /*
   * @dev check if we can transfer all the NFTokens.
   * @param _swapData Data of all the NFToken transfers.
   */
  function _areTransfersAllowed(SwapData _swapData)
    internal
    constant
    returns (bool)
  {
    for(uint i = 0; i < _swapData.nfTokensFrom.length; i++)
    {
      if(!_isAllowed(
        _swapData.from,
        _swapData.nfTokensFrom[i],
        _swapData.idsFrom[i]
      ))
      {
        return false;
      }
    }

    for(i = 0; i < _swapData.nfTokensTo.length; i++)
    {
      if(!_isAllowed(
        _swapData.to,
        _swapData.nfTokensTo[i],
        _swapData.idsTo[i]
      ))
      {
        return false;
      }
    }
    return true;
  }

  /*
   * @dev Transfers ZXC tokens via TokenTransferProxy using transferFrom function.
   * @param _token Address of token to transferFrom.
   * @param _from Address transfering token.
   * @param _to Address receiving token.
   * @param _value Amount of token to transfer.
   * @return Success of token transfer.
   */
  function _transferViaTokenTransferProxy(address _token,
                                          address _from,
                                          address _to,
                                          uint _value)
    internal
    returns (bool)
  {
    return TokenTransferProxy(TOKEN_TRANSFER_PROXY_CONTRACT).transferFrom(
      _token,
      _from,
      _to,
      _value
    );
  }


  /*
   * @dev Transfers NFToken via NFTokenProxy using transfer function.
   * @param _nfToken Address of NFToken to transfer.
   * @param _from Address sending NFToken.
   * @param _to Address receiving NFToken.
   * @param _id Id of transfering NFToken.
   */
  function _transferViaNFTokenTransferProxy(address _nfToken,
                                            address _from,
                                            address _to,
                                            uint256 _id)
    internal
  {
     NFTokenTransferProxy(NFTOKEN_TRANSFER_PROXY_CONTRACT)
      .transferFrom(_nfToken, _from, _to, _id);
  }

  /*
   * @dev Get token balance of an address.
   * The called token contract may attempt to change state, but will not be able to due to an added
   * gas limit. Gas is limited to prevent reentrancy.
   * @param _token Address of token.
   * @param _owner Address of owner.
   * @return Token balance of owner.
   */
  function _getBalance(address _token,
                       address _owner)
    internal
    returns (uint)
  {
    return ERC20(_token).balanceOf.gas(EXTERNAL_QUERY_GAS_LIMIT)(_owner);
  }

  /*
   * @dev Get allowance of token given to TokenTransferProxy by an address.
   * The called token contract may attempt to change state, but will not be able to due to an added
   * gas limit. Gas is limited to prevent reentrancy.
   * @param _token Address of token.
   * @param _owner Address of owner.
   * @return Allowance of token given to TokenTransferProxy by owner.
   */
  function _getAllowance(address _token,
                         address _owner)
    internal
    returns (uint)
  {
    return ERC20(_token).allowance.gas(EXTERNAL_QUERY_GAS_LIMIT)(
      _owner,
      TOKEN_TRANSFER_PROXY_CONTRACT
    );
  }

  /*
   * @dev Checks if we can transfer NFToken.
   * @param _from Address of NFToken sender.
   * @param _nfToken Address of NFToken contract.
   * @param _nfTokenId Id of NFToken (hashed certificate data that is transformed into uint256).
   + @return Permission if we can transfer NFToken.
   */
  function _isAllowed(address _from,
                      address _nfToken,
                      uint256 _nfTokenId)
    internal
    constant
    returns (bool)
  {
    if(ERC721(_nfToken).getApproved(_nfTokenId) == NFTOKEN_TRANSFER_PROXY_CONTRACT)
    {
      return true;
    }

    if(ERC721(_nfToken).isApprovedForAll(_from, NFTOKEN_TRANSFER_PROXY_CONTRACT))
    {
      return true;
    }

    return false;
  }

  /*
   * @dev Creates a sub array from address array.
   * @param _array Array from which we will make a sub array.
   * @param _index Index from which our sub array will be made.
   */
  function _getAddressSubArrayTo(address[] _array,
                                 uint256 _index,
                                 uint256 _to)
    internal
    pure
    returns (address[])
  {
    require(_to >= _index);
    require(_array.length >= _to);
    address[] memory subArray = new address[](_to.sub(_index));
    uint256 j = 0;
    for(uint256 i = _index; i < _to; i++)
    {
      subArray[j] = _array[i];
      j++;
    }

    return subArray;
  }

  /*
   * @dev Creates a sub array from uint256 array.
   * @param _array Array from which we will make a sub array.
   * @param _index Index from which our sub array will be made.
   */
  function _getUintSubArrayTo(uint256[] _array,
                              uint256 _index,
                              uint256 _to)
    internal
    pure
    returns (uint256[])
  {
    require(_to >= _index);
    require(_array.length >= _to);
    uint256[] memory subArray = new uint256[](_to.sub(_index));
    uint256 j = 0;
    for(uint256 i = _index; i < _to; i++)
    {
      subArray[j] = _array[i];
      j++;
    }

    return subArray;
  }

  /**
   * @dev Helper function that pays all the feeAmounts.
   * @param _feeAddresses Addresses of all parties that need to get feeAmounts paid.
   * @param _feeAmounts Fee amounts of all the _feeAddresses (length of both have to be the same).
   * @param _to Address of the fee payer.
   * @return Success of payments.
   */
  function _payfeeAmounts(address[] _feeAddresses,
                          uint256[] _feeAmounts,
                          address _to)
    internal
  {
    for(uint256 i; i < _feeAddresses.length; i++)
    {
      if(_feeAddresses[i] != address(0) && _feeAmounts[i] > 0)
      {
        require(_transferViaTokenTransferProxy(
          TOKEN_CONTRACT,
          _to,
          _feeAddresses[i],
          _feeAmounts[i]
        ));
      }
    }
  }

  /*
   * @dev Helper function that performes all the transfers.
   * @param _swapData Structure of all the neecesary data.
   */
  function _makeNFTokenTransfers(SwapData _swapData)
    internal
  {
    for(uint i = 0; i < _swapData.nfTokensFrom.length; i++)
    {
      _transferViaNFTokenTransferProxy(
        _swapData.nfTokensFrom[i],
        _swapData.from,
        _swapData.to,
        _swapData.idsFrom[i]
      );
    }

    for(i = 0; i < _swapData.nfTokensTo.length; i++)
    {
      _transferViaNFTokenTransferProxy(
        _swapData.nfTokensTo[i],
        _swapData.to,
        _swapData.from,
        _swapData.idsTo[i]
      );
    }
  }
}

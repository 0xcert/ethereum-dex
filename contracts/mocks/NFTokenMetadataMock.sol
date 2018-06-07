pragma solidity ^0.4.23;

import "@0xcert/ethereum-erc721/contracts/tokens/NFTokenMetadata.sol";

contract NFTokenMetadataMock is NFTokenMetadata {

  constructor(
    string _name,
    string _symbol
  )
    public
  {
    nftName = _name;
    nftSymbol = _symbol;
  }

  function mint(
    address _to,
    uint256 _id,
    string _uri
  )
    external
  {
    super._mint(_to, _id);
    super._setTokenUri(_id, _uri);
  }

  function burn(
    address _owner,
    uint256 _tokenId
  )
    external
  {
    super._burn(_owner, _tokenId);
  }

}

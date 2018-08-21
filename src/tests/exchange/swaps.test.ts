import { Spec } from '@specron/spec';

/**
 * Spec context interfaces.
 */

interface Data {
  exchange?: any;
  tokenProxy?: any;
  nftProxy?: any;
  cat?: any;
  owner?: string;
  bob?: string;
  jane?: string;
  sara?: string;
  signature?: any;
  hash?: string;
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>();
const erc721s = new Spec<Data>();
const erc20s = new Spec<Data>();
const erc721sErc20s = new Spec<Data>();
const perform = new Spec<Data>();
const cancel = new Spec<Data>();
const fail = new Spec<Data>();

export default spec;

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts();
  ctx.set('owner', accounts[0]);
  ctx.set('bob', accounts[1]);
  ctx.set('jane', accounts[2]);
  ctx.set('sara', accounts[3]);
});

spec.beforeEach(async (ctx) => {
  const cat = await ctx.deploy({ 
    src: '@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
    args: ['cat', 'CAT'],
  });

  await cat.methods
    .mint(ctx.get('jane'), 1, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });

  await cat.methods
    .mint(ctx.get('bob'), 2, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });

  ctx.set('cat', cat);
});

spec.beforeEach(async (ctx) => {
  const tokenProxy = await ctx.deploy({
    src: './build/token-transfer-proxy.json',
    contract: 'TokenTransferProxy'
  });
  ctx.set('tokenProxy', tokenProxy);
});

spec.beforeEach(async (ctx) => {
  const nftProxy = await ctx.deploy({
    src: './build/nftokens-transfer-proxy.json',
    contract: 'NFTokenTransferProxy',
  });
  ctx.set('nftProxy', nftProxy);
});

spec.beforeEach(async (ctx) => {
  const tokenProxy = ctx.get('tokenProxy');
  const nftProxy = ctx.get('nftProxy');

  const exchange = await ctx.deploy({
    src: './build/exchange.json',
    contract: 'Exchange',
    args: [tokenProxy._address, nftProxy._address],
  });
  ctx.set('exchange', exchange);
});

spec.beforeEach(async (ctx) => {
  const tokenProxy = ctx.get('tokenProxy');
  const nftProxy = ctx.get('nftProxy');
  const exchange = ctx.get('exchange');
  const owner = ctx.get('owner');

  await tokenProxy.methods.addAuthorizedAddress(exchange._address).send({from: owner});
  await nftProxy.methods.addAuthorizedAddress(exchange._address).send({from: owner});
});

/**
 * Test definition.
 * 
 * ERC20: BNB, OMG, BAT, GNT, ZXC
 * ERC721: Cat, Dog, Fox, Bee, Ant, Ape, Pig
 */

/**
 * ERC721s.
 */

perform.spec('between ERC721s', erc721s);

erc721s.test('Cat #1 <=> Cat #2', async (ctx) => {

  const exchange = ctx.get('exchange');
  const nftProxy = ctx.get('nftProxy');
  const jane = ctx.get('jane');
  const bob = ctx.get('bob');
  const cat = ctx.get('cat');

  console.log("jane: ", jane);
  console.log("exchange: ", exchange);
  console.log("cat: ", cat);
  await cat.methods.approve(nftProxy._address, 1).send({from: jane});
  await cat.methods.approve(nftProxy._address, 2).send({from: bob});

  const transfer1 = {
    token: ctx.get('cat')._address,
    kind: 1,
    from: ctx.get('jane'),
    to: ctx.get('bob'),
    value: 1,
  };

  const transfer2 = {
    token: ctx.get('cat')._address,
    kind: 1,
    from: ctx.get('bob'),
    to: ctx.get('jane'),
    value: 2,
  };

  const swapData = {
    maker: ctx.get('jane'),
    taker: ctx.get('bob'),
    transfers: [transfer1, transfer2],
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };

  const claim = ctx.tuple(swapData);
  const hash = await exchange.methods.getSwapDataClaim(claim).call();

  const signature = await ctx.web3.eth.sign(hash, jane);
  const signatureData = {
    r: signature.substr(0, 66),
    s: `0x${signature.substr(66, 64)}`,
    v: parseInt(`0x${signature.substr(130, 2)}`) + 27,
    kind: 0,
  };

  await exchange.methods.swap(swapData, signatureData).send({from: bob});

  const cat1Owner = await cat.methods.ownerOf(1).call();
  const cat2Owner = await cat.methods.ownerOf(2).call();

  ctx.is(cat1Owner, bob);
  ctx.is(cat2Owner, jane);
});

erc721s.test('Cat #1, Cat #4 <=> Cat #2', async (ctx) => {
  
});

erc721s.test('Cat #1, Dog #1 <=> Fox #1, Bee #3', async (ctx) => {
  
});

/**
 * ERC20s.
 */

perform.spec('between ERC20s', erc20s);

erc20s.test('10 BAT <=> 30 GNT', async (ctx) => {
  
});

erc20s.test('20 BAT, 1 BNB <=> 30 GNT, 5 OMG', async (ctx) => {
  
});

/**
 * ERC721s and ERC20s.
 */


perform.spec('between ERC721s and ERC20s', erc721sErc20s);

erc721sErc20s.test('Cat #1, Dog #5, 3 OMG <=> Cat #3, Fox #1, 30 BAT, 5000 BNB', async (ctx) => {
  
});

/**
 * Perform swap.
 */

spec.spec('perform an atomic swap', perform);


/**
 * Cancel swap.
 */

spec.spec('cancel an atomic swap', cancel);

cancel.test('throws when trying to cancel an already performed atomic swap', async (ctx) => {
  
});

/**
 * Swap fails.
 */

spec.spec('fail an atomic swap', fail);

fail.test('when proxy not allowed to transfer nft', async (ctx) => {
  
});

fail.test('when proxy has unsofficient allowence for a token', async (ctx) => {
  
});

fail.test('when _to address is not the one performing the transfer', async (ctx) => {
  
});

fail.test('when _to and _from addresses are the same', async (ctx) => {
  
});

fail.test('when current time is after expirationTimestamp', async (ctx) => {
  
});
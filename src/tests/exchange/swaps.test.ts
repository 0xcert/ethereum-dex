import { Spec } from '@specron/spec';

/**
 * Test definition.
 * 
 * ERC20: ZXC, BNB, OMG, BAT, GNT
 * ERC721: Cat, Dog, Fox, Bee, Ant, Ape, Pig
 */


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
  zxc?: any;
  gnt?: any;
}

interface CancelData extends Data {
  signatureTuple?: any;
  dataTuple?: any;
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>();
const erc721s = new Spec<Data>();
const erc20s = new Spec<Data>();
const erc721sErc20s = new Spec<Data>();
const perform = new Spec<Data>();
const cancel = new Spec<CancelData>();
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
  const zxc = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json'
  });
  ctx.set('zxc', zxc);
});

spec.beforeEach(async (ctx) => {
  const jane = ctx.get('jane');
  const gnt = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json',
    from: jane
  });
  ctx.set('gnt', gnt);
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
  await tokenProxy.methods.addAuthorizedAddress(exchange._address).send({ from: owner });
  await nftProxy.methods.addAuthorizedAddress(exchange._address).send({ from: owner });
});

/**
 * Perform swap.
 */

spec.spec('perform an atomic swap', perform);

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

  const transfers = [
    {
      token: cat._address,
      kind: 1,
      from: jane,
      to: bob,
      value: 1,
    },
    {
      token: cat._address,
      kind: 1,
      from: bob,
      to: jane,
      value: 2,
    },
  ];
  const swapData = {
    maker: jane,
    taker: bob,
    transfers,
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };
  const swapDataTuple = ctx.tuple(swapData);
  const claim = await exchange.methods.getSwapDataClaim(swapDataTuple).call();

  const signature = await ctx.web3.eth.sign(claim, jane);
  const signatureData = {
    r: signature.substr(0, 66),
    s: `0x${signature.substr(66, 64)}`,
    v: parseInt(`0x${signature.substr(130, 2)}`) + 27,
    kind: 0,
  };
  const signatureDataTuple = ctx.tuple(signatureData);

  await cat.methods.approve(nftProxy._address, 1).send({ from: jane });
  await cat.methods.approve(nftProxy._address, 2).send({ from: bob });
  const logs = await exchange.methods.swap(swapDataTuple, signatureDataTuple).send({ from: bob, gas: 4000000 });
  ctx.not(logs.events.PerformSwap, undefined);

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

erc20s.test('3000 ZXC <=> 50000 GNT', async (ctx) => {
  const exchange = ctx.get('exchange');
  const tokenProxy = ctx.get('tokenProxy');
  const jane = ctx.get('jane');
  const owner = ctx.get('owner');
  const zxc = ctx.get('zxc');
  const gnt = ctx.get('gnt');
  const zxcAmount = 3000;
  const gntAmount = 50000;

  const transfers = [
    {
      token: zxc._address,
      kind: 0,
      from: ctx.get('owner'),
      to: ctx.get('jane'),
      value: zxcAmount,
    },
    {
      token: gnt._address,
      kind: 0,
      from: ctx.get('jane'),
      to: ctx.get('owner'),
      value: gntAmount,
    },
  ];
  const swapData = {
    maker: ctx.get('owner'),
    taker: ctx.get('jane'),
    transfers,
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };
  const swapDataTuple = ctx.tuple(swapData);
  const claim = await exchange.methods.getSwapDataClaim(swapDataTuple).call();

  const signature = await ctx.web3.eth.sign(claim, owner);
  const signatureData = {
    r: signature.substr(0, 66),
    s: `0x${signature.substr(66, 64)}`,
    v: parseInt(`0x${signature.substr(130, 2)}`) + 27,
    kind: 0,
  };
  const signatureDataTuple = ctx.tuple(signatureData);

  await zxc.methods.approve(tokenProxy._address, zxcAmount).send({ from: owner });
  await gnt.methods.approve(tokenProxy._address, gntAmount).send({ from: jane });
  const logs = await exchange.methods.swap(swapDataTuple, signatureDataTuple).send({from: jane, gas: 4000000});
  ctx.not(logs.events.PerformSwap, undefined);

  const janeBalance = await zxc.methods.balanceOf(jane).call();
  const ownerBalance = await gnt.methods.balanceOf(owner).call();
  ctx.is(janeBalance, zxcAmount.toString());
  ctx.is(ownerBalance, gntAmount.toString());
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
 * Cancel swap.
 */

spec.spec('cancel an atomic swap', cancel);

cancel.beforeEach(async (ctx) => {
  const exchange = ctx.get('exchange');
  const nftProxy = ctx.get('nftProxy');
  const jane = ctx.get('jane');
  const bob = ctx.get('bob');
  const cat = ctx.get('cat');

  const transfers = [
    {
      token: cat._address,
      kind: 1,
      from: jane,
      to: bob,
      value: 1,
    },
    {
      token: cat._address,
      kind: 1,
      from: bob,
      to: jane,
      value: 2,
    },
  ];
  const swapData = {
    maker: jane,
    taker: bob,
    transfers,
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };
  const swapDataTuple = ctx.tuple(swapData);
  const claim = await exchange.methods.getSwapDataClaim(swapDataTuple).call();

  const signature = await ctx.web3.eth.sign(claim, jane);
  const signatureData = {
    r: signature.substr(0, 66),
    s: `0x${signature.substr(66, 64)}`,
    v: parseInt(`0x${signature.substr(130, 2)}`) + 27,
    kind: 0,
  };
  const signatureDataTuple = ctx.tuple(signatureData);

  await cat.methods.approve(nftProxy._address, 1).send({ from: jane });
  await cat.methods.approve(nftProxy._address, 2).send({ from: bob });

  ctx.set('signatureTuple', signatureDataTuple);
  ctx.set('dataTuple', swapDataTuple);
});

cancel.test('succesfully', async (ctx) => {
  const signatureTuple = ctx.get('signatureTuple');
  const dataTuple = ctx.get('dataTuple');
  const exchange = ctx.get('exchange');
  const jane = ctx.get('jane');
  const bob = ctx.get('bob');

  const logs = await exchange.methods.cancelSwap(dataTuple).send({ from: jane });
  ctx.not(logs.events.CancelSwap, undefined);
  await ctx.reverts(() => exchange.methods.swap(dataTuple, signatureTuple).send({ from: bob, gas: 4000000 }));
});

cancel.test('throws when trying to cancel an already performed atomic swap', async (ctx) => {
  const signatureTuple = ctx.get('signatureTuple');
  const dataTuple = ctx.get('dataTuple');
  const exchange = ctx.get('exchange');
  const jane = ctx.get('jane');
  const bob = ctx.get('bob');

  await exchange.methods.swap(dataTuple, signatureTuple).send({ from: bob, gas: 4000000 });
  await ctx.reverts(() => exchange.methods.cancelSwap(dataTuple).send({ from: jane }));
});

cancel.test('throws when a third party tries to cancel an atomic swap', async (ctx) => {
  const dataTuple = ctx.get('dataTuple');
  const exchange = ctx.get('exchange');
  const sara = ctx.get('sara');

  await ctx.reverts(() => exchange.methods.cancelSwap(dataTuple).send({ from: sara }));
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

fail.test('when using invalid token kind', async (ctx) => {
  
});
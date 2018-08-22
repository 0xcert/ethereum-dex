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
  dog?: any;
  fox?: any;
  bee?: any;
  owner?: string;
  bob?: string;
  jane?: string;
  sara?: string;
  zxc?: any;
  gnt?: any;
  bnb?: any;
  omg?: any;
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

/**
 * Cat
 * Jane owns: #1, #4
 * Bob owns: #2, #3
 */
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
    .mint(ctx.get('jane'), 4, '0xcert.org')
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
  await cat.methods
    .mint(ctx.get('bob'), 3, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });
  ctx.set('cat', cat);
});

/**
 * Dog
 * Jane owns: #1
 */
spec.beforeEach(async (ctx) => {
  const dog = await ctx.deploy({ 
    src: '@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
    args: ['dog', 'DOG'],
  });
  await dog.methods
    .mint(ctx.get('jane'), 1, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });
  ctx.set('dog', dog);
});

/**
 * Bee
 * Bob owns: #3
 */
spec.beforeEach(async (ctx) => {
  const bee = await ctx.deploy({ 
    src: '@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
    args: ['bee', 'BEE'],
  });
  await bee.methods
    .mint(ctx.get('bob'), 3, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });
  ctx.set('bee', bee);
});

/**
 * Fox
 * Bob owns: #1
 */
spec.beforeEach(async (ctx) => {
  const fox = await ctx.deploy({ 
    src: '@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
    args: ['fox', 'FOX'],
  });
  await fox.methods
    .mint(ctx.get('bob'), 1, '0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });
  ctx.set('fox', fox);
});

/**
 * ZXC
 * Owner owns: all
 */
spec.beforeEach(async (ctx) => {
  const zxc = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json'
  });
  ctx.set('zxc', zxc);
});

/**
 * BNB
 * Owner owns: all
 */
spec.beforeEach(async (ctx) => {
  const bnb = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json'
  });
  ctx.set('bnb', bnb);
});

/**
 * GNT
 * Jane owns: all
 */
spec.beforeEach(async (ctx) => {
  const jane = ctx.get('jane');
  const gnt = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json',
    from: jane
  });
  ctx.set('gnt', gnt);
});

/**
 * OMG
 * Jane owns: all
 */
spec.beforeEach(async (ctx) => {
  const jane = ctx.get('jane');
  const omg = await ctx.deploy({
    src: '@0xcert/ethereum-erc20/build/contracts/TokenMock.json',
    from: jane
  });
  ctx.set('omg', omg);
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
      from: jane,
      to: bob,
      value: 4,
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
  await cat.methods.approve(nftProxy._address, 4).send({ from: jane });
  await cat.methods.approve(nftProxy._address, 2).send({ from: bob });
  const logs = await exchange.methods.swap(swapDataTuple, signatureDataTuple).send({ from: bob, gas: 4000000 });
  ctx.not(logs.events.PerformSwap, undefined);

  const cat1Owner = await cat.methods.ownerOf(1).call();
  const cat2Owner = await cat.methods.ownerOf(2).call();
  const cat4Owner = await cat.methods.ownerOf(4).call();
  ctx.is(cat1Owner, bob);
  ctx.is(cat2Owner, jane);
  ctx.is(cat4Owner, bob);
});

erc721s.test('Cat #1, Dog #1 <=> Fox #1, Bee #3', async (ctx) => {
  const exchange = ctx.get('exchange');
  const nftProxy = ctx.get('nftProxy');
  const jane = ctx.get('jane');
  const bob = ctx.get('bob');
  const cat = ctx.get('cat');
  const dog = ctx.get('dog');
  const fox = ctx.get('fox');
  const bee = ctx.get('bee');

  const transfers = [
    {
      token: cat._address,
      kind: 1,
      from: jane,
      to: bob,
      value: 1,
    },
    {
      token: dog._address,
      kind: 1,
      from: jane,
      to: bob,
      value: 1,
    },
    {
      token: fox._address,
      kind: 1,
      from: bob,
      to: jane,
      value: 1,
    },
    {
      token: bee._address,
      kind: 1,
      from: bob,
      to: jane,
      value: 3,
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
  await dog.methods.approve(nftProxy._address, 1).send({ from: jane });
  await fox.methods.approve(nftProxy._address, 1).send({ from: bob });
  await bee.methods.approve(nftProxy._address, 3).send({ from: bob });
  const logs = await exchange.methods.swap(swapDataTuple, signatureDataTuple).send({ from: bob, gas: 6000000 });
  ctx.not(logs.events.PerformSwap, undefined);

  const cat1Owner = await cat.methods.ownerOf(1).call();
  const dog1Owner = await dog.methods.ownerOf(1).call();
  const fox1Owner = await fox.methods.ownerOf(1).call();
  const bee3Owner = await bee.methods.ownerOf(3).call();
  ctx.is(cat1Owner, bob);
  ctx.is(dog1Owner, bob);
  ctx.is(fox1Owner, jane);
  ctx.is(bee3Owner, jane);
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
      from: owner,
      to: jane,
      value: zxcAmount,
    },
    {
      token: gnt._address,
      kind: 0,
      from: jane,
      to: owner,
      value: gntAmount,
    },
  ];
  const swapData = {
    maker: owner,
    taker: jane,
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

erc20s.test('500 ZXC, 1 BNB <=> 30 GNT, 5 OMG', async (ctx) => {
  const exchange = ctx.get('exchange');
  const tokenProxy = ctx.get('tokenProxy');
  const jane = ctx.get('jane');
  const owner = ctx.get('owner');
  const zxc = ctx.get('zxc');
  const gnt = ctx.get('gnt');
  const bnb = ctx.get('bnb');
  const omg = ctx.get('omg');
  const zxcAmount = 500;
  const gntAmount = 30;
  const bnbAmount = 1;
  const omgAmount = 5;

  const transfers = [
    {
      token: zxc._address,
      kind: 0,
      from: owner,
      to: jane,
      value: zxcAmount,
    },
    {
      token: bnb._address,
      kind: 0,
      from: owner,
      to: jane,
      value: bnbAmount,
    },
    {
      token: gnt._address,
      kind: 0,
      from: jane,
      to: owner,
      value: gntAmount,
    },
    {
      token: omg._address,
      kind: 0,
      from: jane,
      to: owner,
      value: omgAmount,
    },
  ];
  const swapData = {
    maker: owner,
    taker: jane,
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
  await bnb.methods.approve(tokenProxy._address, bnbAmount).send({ from: owner });
  await gnt.methods.approve(tokenProxy._address, gntAmount).send({ from: jane });
  await omg.methods.approve(tokenProxy._address, omgAmount).send({ from: jane });
  const logs = await exchange.methods.swap(swapDataTuple, signatureDataTuple).send({from: jane, gas: 4000000});
  ctx.not(logs.events.PerformSwap, undefined);

  const janeZxcBalance = await zxc.methods.balanceOf(jane).call();
  const janeBnbBalance = await bnb.methods.balanceOf(jane).call();
  const ownerGntBalance = await gnt.methods.balanceOf(owner).call();
  const ownerOmgBalance = await omg.methods.balanceOf(owner).call();
  ctx.is(janeZxcBalance, zxcAmount.toString());
  ctx.is(janeBnbBalance, bnbAmount.toString());
  ctx.is(ownerGntBalance, gntAmount.toString());
  ctx.is(ownerOmgBalance, omgAmount.toString());
});

/**
 * ERC721s and ERC20s.
 */


perform.spec('between ERC721s and ERC20s', erc721sErc20s);

erc721sErc20s.test('Cat #1  <=>  5000 BNB', async (ctx) => {
  
});

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

cancel.test('succeeds', async (ctx) => {
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
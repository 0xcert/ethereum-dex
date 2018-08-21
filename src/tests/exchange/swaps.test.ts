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
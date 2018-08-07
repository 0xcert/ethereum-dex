import { Spec } from '@specron/spec';

/**
 * Spec context interfaces.
 */

interface Data {
  exchange?: any;
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
const raw = new Spec<Data>();
const signed = new Spec<Data>();

export default spec;

/**
 * Test definitions.
 */

spec.beforeEach(async (ctx) => {
  const exchange = await ctx.requireContract({
    src: './build/Exchange.json',
  });
  ctx.set('exchange', exchange);
});

spec.beforeEach(async (ctx) => {
  const cat = await ctx.requireContract({ 
    src: './node_modules/@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
    args: ['cat', 'CAT'],
  });
  await cat.methods
    .mint(ctx.get('jane'), 1, 'http://0xcert.org')
    .send({
      from: ctx.get('owner'),
      gas: 4000000,
    });
  ctx.set('cat', cat);
});

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.getAccounts();
  ctx.set('owner', accounts[0]);
  ctx.set('bob', accounts[1]);
  ctx.set('jane', accounts[2]);
  ctx.set('sara', accounts[3]);
});

spec.spec('generate claim', raw);

raw.test('from valid data', async (ctx) => {
  const exchange = ctx.get('exchange');
  const claim = {
    maker: ctx.get('jane'),
    taker: ctx.get('sara'),
    transfers: [
      {
        token: ctx.get('cat')._address,
        kind: 1,
        from: ctx.get('jane'),
        to: ctx.get('sara'),
        value: 1,
      },
    ],
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };
  const tuple = ctx.toTuple(claim);
  const hash = await exchange.methods.getSwapDataClaim(tuple).call();
  // TODO(Tadej): generate hash locally and compare.
  // TODO(Tadej): ctx.is(hash);
});

raw.test('from invalid data', async (ctx) => {
  // TODO(Tadej): add test when we know how to generate hash locally.
});

spec.spec('validate signed claim', signed);

signed.beforeEach(async (ctx) => {
  const claim = {
    maker: ctx.get('jane'),
    taker: ctx.get('sara'),
    transfers: [
      {
        token: ctx.get('cat')._address,
        kind: 1,
        from: ctx.get('jane'),
        to: ctx.get('sara'),
        value: 1,
      },
    ],
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600,
  };
  const exchange = ctx.get('exchange');
  const tuple = ctx.toTuple(claim);
  const hash = await exchange.methods.getSwapDataClaim(tuple).call();
  ctx.set('hash', hash);
});

signed.beforeEach(async (ctx) => {
  const hash = ctx.get('hash');
  const account = ctx.get('jane');
  const signature = await ctx.web3.eth.sign(hash, account);
  const signatureData = {
    r: signature.substr(0, 66),
    s: `0x${signature.substr(66, 64)}`,
    v: parseInt(`0x${signature.substr(130, 2)}`) + 27,
    kind: 0,
  };
  ctx.set('signature', signatureData);
});

signed.test('with valid signature data', async (ctx) => {
  const exchange = ctx.get('exchange');
  const account = ctx.get('jane');
  const hash = ctx.get('hash');
  const signature = ctx.get('signature');
  const tuple = ctx.toTuple(signature);
  const valid = await exchange.methods.isValidSignature(account, hash, tuple).call();
  ctx.true(valid);
});

signed.test('with invalid signature data', async (ctx) => {
  const exchange = ctx.get('exchange');
  const signatureData = ctx.get('signature');
  signatureData.v = 30;
  const account = ctx.get('jane');
  const hash = ctx.get('hash');
  const tuple = ctx.toTuple(signatureData);
  const valid = await exchange.methods.isValidSignature(account, hash, tuple).call();
  ctx.false(valid);
});

signed.test('from a third party account', async (ctx) => {
  const exchange = ctx.get('exchange');
  const account = ctx.get('sara');
  const hash = ctx.get('hash');
  const signature = ctx.get('signature');
  const tuple = ctx.toTuple(signature);
  const valid = await exchange.methods.isValidSignature(account, hash, tuple).call();
  ctx.false(valid);
});

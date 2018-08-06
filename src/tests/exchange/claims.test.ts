import { Spec } from '@specron/spec';

interface Data {
  exchange: any;
  cat: any;
  owner: string;
  account1: string;
  account2: string;
  account3: string;
  account4: string;
  account5: string;
  account6: string;
  account7: string;
  account8: string;
  account9: string;
}

interface SignatureData extends Data {
  signature: any;
  hash: string;
}

const signedClaim = new Spec<SignatureData>();

signedClaim.beforeEach(async (ctx) => {
  const claim = {
    maker: ctx.get('account2'),
    taker: ctx.get('account3'),
    transfers: [
      {
        token: ctx.get('cat')._address,
        kind: 1,
        from: ctx.get('account2'),
        to: ctx.get('account3'),
        value: 1
      }
    ],
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600
  }

  const exchange = ctx.get('exchange');
  const hash = await exchange.methods.getSwapDataClaim(ctx.toTuple(claim)).call();
  ctx.set('hash', hash);
  const signature = await ctx.web3.eth.sign(hash, ctx.get('account2'));
  const signatureData = {
    r: signature.substr(0, 66),
    s: '0x' + signature.substr(66, 64),
    v: parseInt('0x' + signature.substr(130, 2)) + 27,
    kind: 0
  }
  ctx.set('signature', signatureData);
});

signedClaim.test('with valid signature data', async (ctx) => {
  const exchange = ctx.get('exchange');
  const valid = await exchange.methods
    .isValidSignature(
      ctx.get('account2'),
      ctx.get('hash'),
      ctx.toTuple(ctx.get('signature'))
    ).call();
  ctx.true(valid);
});

signedClaim.test('with invalid signature data', async (ctx) => {
  const exchange = ctx.get('exchange');
  const signatureData = ctx.get('signature');
  signatureData.v = 30;
  const valid = await exchange.methods
    .isValidSignature(
      ctx.get('account2'),
      ctx.get('hash'),
      ctx.toTuple(signatureData)
    ).call();
  ctx.false(valid);
});

signedClaim.test('from a third party account', async (ctx) => {
  const exchange = ctx.get('exchange');
  const valid = await exchange.methods
    .isValidSignature(
      ctx.get('account3'),
      ctx.get('hash'),
      ctx.toTuple(ctx.get('signature'))
    ).call();
  ctx.false(valid);
});

const rawClaim = new Spec<Data>();

rawClaim.test('from valid data', async (ctx) => {

  const claim = {
    maker: ctx.get('account2'),
    taker: ctx.get('account3'),
    transfers: [
      {
        token: ctx.get('cat')._address,
        kind: 1,
        from: ctx.get('account2'),
        to: ctx.get('account3'),
        value: 1
      }
    ],
    seed: new Date().getTime(), 
    expiration: new Date().getTime() + 600
  }

  const exchange = ctx.get('exchange');
  const hash = await exchange.methods.getSwapDataClaim(ctx.toTuple(claim)).call();

  // TODO(Tadej): generate hash locally and compare.

  // ctx.is(hash, );
});

rawClaim.test('from invalid data', async (ctx) => {
  // TODO(Tadej): add test when we know how to generate hash locally.
});

const spec = new Spec<Data>();

spec.beforeEach(async (ctx) => {
  ctx.set('exchange', await ctx.requireContract({ src: './build/Exchange.json' }));
  const accounts = await ctx.getAccounts();
  ctx.set('owner', accounts[0]);
  ctx.set('account1', accounts[1]);
  ctx.set('account2', accounts[2]);
  ctx.set('account3', accounts[3]);
  ctx.set('account4', accounts[4]);
  ctx.set('account5', accounts[5]);
  ctx.set('account6', accounts[6]);
  ctx.set('account7', accounts[7]);
  ctx.set('account8', accounts[8]);
  ctx.set('account9', accounts[9]);

  const catNFT = await ctx.requireContract(
    { 
      src: './node_modules/@0xcert/ethereum-erc721/build/contracts/NFTokenMetadataEnumerableMock.json',
      args: ['cat', 'CAT'],
      gas: 4000000
    }
  );

  ctx.set('cat', catNFT);

  await catNFT.methods
    .mint(ctx.get('account2'), 1, 'http://0xcert.org')
    .send({from: ctx.get('owner'), gas: 4000000});
});

spec.spec('generate claim', rawClaim);
spec.spec('validate signed claim', signedClaim);

export default spec;
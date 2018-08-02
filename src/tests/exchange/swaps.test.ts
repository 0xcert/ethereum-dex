import { Spec } from '@specron/spec';

/**
 * ERC721s.
 */

const erc721s = new Spec();

erc721s.test('Cat #1 <=> Cat #2', async (ctx) => {
  
});

erc721s.test('Cat #1, Cat #4 <=> Cat #2', async (ctx) => {
  
});

erc721s.test('Cat #1, Dog #1 <=> Fox #1, Bee #3', async (ctx) => {
  
});

/**
 * ERC20s.
 */

const erc20s = new Spec();

erc20s.test('10 BAT <=> 30 GNT', async (ctx) => {
  
});

erc20s.test('20 BAT, 1 BNB <=> 30 GNT, 5 OMG', async (ctx) => {
  
});

/**
 * ERC721s and ERC20s.
 */

const erc721sErc20s = new Spec();

erc721sErc20s.test('Cat #1, Dog #5, 3 OMG <=> Cat #3, Fox #1, 30 BAT, 5000 BNB', async (ctx) => {
  
});

/**
 * Perform swap.
 */

const perform = new Spec();

perform.spec('between ERC721s', erc721s);

perform.spec('between ERC20s', erc20s);

perform.spec('between ERC721s and ERC20s', erc721sErc20s);

/**
 * Cancel swap.
 */

const cancel = new Spec();

cancel.test('throws when trying to cancel an already performed atomic swap', async (ctx) => {
  
});

/**
 * Swap fails.
 */

const fail = new Spec();

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

/**
 * Test definition.
 * 
 * ERC20: BNB, OMG, BAT, GNT, ZXC
 * ERC721: Cat, Dog, Fox, Bee, Ant, Ape, Pig
 */

const spec = new Spec();

spec.spec('perform an atomic swap', perform);

spec.spec('fail an atomic swap', fail);

spec.spec('cancel an atomic swap', cancel);

export default spec;
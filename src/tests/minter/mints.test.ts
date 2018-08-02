import { Spec } from '@specron/spec';

/**
 * Perform mint.
 */

const perform = new Spec();

perform.test('Cat #1 <=> 10 ZXC', async (ctx) => {
  
});

perform.test('Cat #1 <=> no fee', async (ctx) => {
  
});

perform.test('fails if msg.sender is not the receiver', async (ctx) => {
  
});

perform.test('fails when trying to perform already performed mint', async (ctx) => {
  
});

perform.test('fails when approved token amount is not sufficient', async (ctx) => {
  
});

perform.test('fails when trying to perform canceled mint', async (ctx) => {
  
});

perform.test('fails when proxy does not have the mint rights', async (ctx) => {
  
});

perform.test('fails when to and the owner addresses are the same', async (ctx) => {
  
});

perform.test('fails if current time is after expirationTimestamp', async (ctx) => {
  
});


/**
 * Cancel mint.
 */

const cancel = new Spec();

cancel.test('sucesfully', async (ctx) => {
  
});

cancel.test('fails when a third party tries to cancel it', async (ctx) => {
  
});

cancel.test('fails when trying to cancel an already performed mint', async (ctx) => {
  
});

/**
 * Test definition.
 * 
 * ERC20: BNB, OMG, BAT, GNT, ZXC
 * ERC721: Cat, Dog, Fox, Bee, Ant, Ape, Pig
 */

const spec = new Spec();

spec.spec('perform atomic mint', perform);

spec.spec('cancel atomic mint', cancel);

export default spec;
import { Spec } from '@specron/spec';

const spec = new Spec();

spec.test('check is token proxy address is correct', async (ctx) => {
  
});

spec.test('check is nft proxy address is correct', async (ctx) => {
  
});

spec.test('compare the same localy generated claim hash with contract generated claim hash', async (ctx) => {
  
});

spec.test('compare different localy generated claim hash with contract generated claim hash', async (ctx) => {
  
});

spec.test('correctly validates correct signer', async (ctx) => {
  
});

spec.test('correctly validates wrong signature data', async (ctx) => {
  
});

spec.test('correctly validates signature data from another account', async (ctx) => {
  
});

spec.test('successfuly cancels atomic swap claim', async (ctx) => {
  
});

spec.test('throws when someone else then the atomic swap claim maker tries to cancel it', async (ctx) => {
  
});

spec.test('throws when trying to cancel an already performed atomic swap', async (ctx) => {
  
});

spec.test('correctly performs an atomic swap', async (ctx) => {
  
});

spec.test('correctly performs an atomic swap with multiple fees with different tokens', async (ctx) => {
  
});

spec.test('correctly performs an atomic swap with no fees', async (ctx) => {
  
});

spec.test('correctly performs an atomic swap with multiple different nfts', async (ctx) => {
  
});

spec.test('throws when trying to cancel an already performed atomic swap', async (ctx) => {
  
});

spec.test('fails an atomic swap when proxy not allowed to transfer nft', async (ctx) => {
  
});

spec.test('fails an atomic swap when proxy has unsofficient allowence for a token', async (ctx) => {
  
});

spec.test('fails an atomic swap when _to address is not the one performing the transfer', async (ctx) => {
  
});

spec.test('fails an atomic swap when _to and _from addresses are the same', async (ctx) => {
  
});

spec.test('fails an atomic swap when current time is after expirationTimestamp', async (ctx) => {
  
});

export default spec;
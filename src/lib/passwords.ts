import type { PasswordVerifier } from '@/types/accounts';
const iterations = 310_000;
function subtle() {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      'El registro local necesita Web Crypto. Abra la aplicación en localhost o mediante HTTPS.',
    );
  return crypto.subtle;
}
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const bytes = (value: string) => new Uint8Array(value.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
async function derive(password: string, salt: Uint8Array<ArrayBuffer>, count: number) {
  const api = subtle();
  const material = await api.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return new Uint8Array(
    await api.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: count },
      material,
      256,
    ),
  );
}
export async function createVerifier(password: string): Promise<PasswordVerifier> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return {
    algorithm: 'PBKDF2-SHA256',
    iterations,
    salt: hex(salt),
    hash: hex(await derive(password, salt, iterations)),
  };
}
export async function verifyPassword(password: string, verifier: PasswordVerifier) {
  const candidate = await derive(password, bytes(verifier.salt), verifier.iterations);
  const expected = bytes(verifier.hash);
  let difference = candidate.length ^ expected.length;
  for (let i = 0; i < candidate.length; i++) difference |= candidate[i] ^ expected[i];
  return difference === 0;
}

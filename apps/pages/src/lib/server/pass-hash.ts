import { dev } from "$app/environment";
import { sha256 } from "@oslojs/crypto/sha2";

export const argonHash = async (platform: App.Platform | undefined, password: string): Promise<string | null> => {
  if (dev) {
    const encoded = new TextEncoder().encode(password)
    return new TextDecoder().decode(sha256(encoded))
  }
  //TODO: Implement error handling, this should probably throw?
  if (!platform) return null;

  const Argon2Binding = platform.env.PasswordHasher;
  const data = {
    password: password
  }

  const fetchHash = await Argon2Binding.fetch("https://internal/hash", {
    body: JSON.stringify(data),
    method: 'POST'
  })

  if (fetchHash.ok) {
    const { hash } = await fetchHash.json();
    return hash;
  }
  return null;
}


export const argonVerify = async (platform: App.Platform | undefined, hash: string, password: string): Promise<boolean> => {
  if (dev) {
    const encoded = new TextEncoder().encode(password)
    const hashed = new TextDecoder().decode(sha256(encoded))
    if (hashed == hash) {
      return true;
    }
    return false
  }
  if (!platform) return false;

  const Argon2Binding = platform.env.PasswordHasher;
  const data = {
    password: password,
    hash: hash
  }
  const fetchHash = await Argon2Binding.fetch("https://internal/verify", {
    body: JSON.stringify(data),
    method: 'POST'
  })

  if (fetchHash.ok) {
    const { matches } = await fetchHash.json();
    console.log(fetchHash);
    if (matches) return true
  }
  return false
}


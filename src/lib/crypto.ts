/**
 * Simple E2EE Utility using Web Crypto API
 */

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyStr = btoa(String.fromCharCode(...new Uint8Array(exportedPublic)));

  return {
    publicKey: publicKeyStr,
    privateKey: keyPair.privateKey,
  };
}

export async function encryptContent(content: string, publicKeys: { [uid: string]: string }): Promise<{ encryptedContent: string; iv: string; encKeys: { [uid: string]: string } }> {
  // 1. Generate a random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt content with AES
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedContent = new TextEncoder().encode(content);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedContent
  );

  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encKeys: { [uid: string]: string } = {};

  // 3. Encrypt AES key for each recipient's RSA Public Key
  for (const [uid, pubKeyStr] of Object.entries(publicKeys)) {
    try {
      const spkiBuffer = Uint8Array.from(atob(pubKeyStr), c => c.charCodeAt(0));
      const recipientPublicKey = await window.crypto.subtle.importKey(
        "spki",
        spkiBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        recipientPublicKey,
        exportedAesKey
      );
      encKeys[uid] = btoa(String.fromCharCode(...new Uint8Array(encryptedKeyBuffer)));
    } catch (err) {
      console.error(`Failed to encrypt AES key for user ${uid}:`, err);
    }
  }

  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
    iv: btoa(String.fromCharCode(...iv)),
    encKeys,
  };
}

export async function decryptContent(encryptedContentStr: string, encryptedAesKeyStr: string, ivStr: string, privateKey: CryptoKey): Promise<string> {
  const encryptedContent = Uint8Array.from(atob(encryptedContentStr), c => c.charCodeAt(0));
  const encryptedAesKey = Uint8Array.from(atob(encryptedAesKeyStr), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));

  // 1. Decrypt AES key using our Private Key
  const aesKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKey
  );

  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyBuffer,
    "AES-GCM",
    true,
    ["decrypt"]
  );

  // 2. Decrypt content using AES
  const decryptedContentBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedContent
  );

  return new TextDecoder().decode(decryptedContentBuffer);
}

// In a real app, you'd store the private key in IndexedDB securely.
// For this demo, we'll keep it in memory or simple session persistence if possible.

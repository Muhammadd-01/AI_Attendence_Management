/**
 * WebAuthn Biometric Service (Device Fingerprint / Touch ID / Windows Hello)
 */

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks if the user device supports native fingerprint / Touch ID
 */
export async function isBiometricAvailable() {
  if (window.PublicKeyCredential && 
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Prompts user to touch their hardware fingerprint sensor / Touch ID to register credentials
 * @param {string} userId - Unique Student or Teacher ID
 * @param {string} userName - Full name of the user
 * @returns {object} Biometric credential object
 */
export async function registerBiometricFingerprint(userId, userName) {
  if (!window.PublicKeyCredential) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  // Create a 32-byte cryptographically random challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userIdBuffer = new TextEncoder().encode(userId);

  const createOptions = {
    publicKey: {
      challenge: challenge,
      rp: {
        name: "AI Attendance Manager",
        id: window.location.hostname || "localhost",
      },
      user: {
        id: userIdBuffer,
        name: userId,
        displayName: userName || userId,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256 (ECDSA with SHA-256)
        { type: "public-key", alg: -257 } // RS256 (RSA with SHA-256)
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Native device Touch ID / Fingerprint sensor
        userVerification: "required",
        residentKey: "preferred"
      },
      timeout: 60000,
      attestation: "none"
    }
  };

  const credential = await navigator.credentials.create(createOptions);
  
  if (!credential) {
    throw new Error("Biometric enrollment was cancelled or failed.");
  }

  const credentialId = bufferToBase64(credential.rawId);

  return {
    success: true,
    credentialId: credentialId,
    type: credential.type,
    enrolledAt: new Date().toISOString()
  };
}

/**
 * Authenticates the user via the physical fingerprint sensor
 * @param {string} credentialId - Base64 credential ID (optional)
 * @returns {boolean} Whether fingerprint matched
 */
export async function verifyBiometricFingerprint(credentialId = null) {
  if (!window.PublicKeyCredential) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const getOptions = {
    publicKey: {
      challenge: challenge,
      rpId: window.location.hostname || "localhost",
      userVerification: "required",
      timeout: 60000,
    }
  };

  if (credentialId) {
    getOptions.publicKey.allowCredentials = [{
      type: "public-key",
      id: base64ToBuffer(credentialId),
      transports: ["internal"]
    }];
  }

  const assertion = await navigator.credentials.get(getOptions);
  
  if (!assertion) {
    throw new Error("Fingerprint verification failed.");
  }

  return {
    verified: true,
    credentialId: bufferToBase64(assertion.rawId),
    timestamp: new Date().toISOString()
  };
}

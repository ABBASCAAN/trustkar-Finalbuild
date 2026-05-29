/** Firebase Auth errors → user-friendly messages */
export function getAuthErrorMessage(codeOrMessage) {
  const code = String(codeOrMessage || "");
  if (code.includes("auth/email-already-in-use")) {
    return "Yeh email pehle se registered hai. Login karein.";
  }
  if (code.includes("auth/invalid-email")) return "Email sahi format mein likhein.";
  if (code.includes("auth/weak-password")) return "Password kam az kam 6 characters ka ho.";
  if (code.includes("auth/user-not-found") || code.includes("auth/wrong-password")) {
    return "Email ya password galat hai.";
  }
  if (code.includes("auth/invalid-credential")) {
    return "Email ya password galat hai.";
  }
  if (code.includes("auth/too-many-requests")) {
    return "Bahut zyada tries. Thori der baad dubara try karein.";
  }
  if (code.includes("permission-denied")) {
    return "Firebase permission error — Console mein Firestore Rules publish karein.";
  }
  return codeOrMessage || "Kuch galat ho gaya. Dubara try karein.";
}

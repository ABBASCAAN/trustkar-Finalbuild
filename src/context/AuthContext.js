"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { isPhoneRegistered } from "@/lib/firestore-helpers";

const AuthContext = createContext(null);

async function saveUserProfile(uid, data) {
  await setDoc(
    doc(db, COLLECTIONS.USERS, uid),
    {
      ...data,
      uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return null;
    }
    const ref = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.suspended) {
        setProfile(data);
        return data;
      }
      setProfile(data);
      return data;
    }
    const newProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      emailVerified: false,
      displayName: firebaseUser.displayName || "",
      phone: "",
      phoneVerified: false,
      cnic: "",
      cnicVerified: false,
      selfieUrl: "",
      selfieVerified: false,
      trustRating: 5.0,
      completedDeals: 0,
      role: "user",
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    setProfile(newProfile);
    return newProfile;
  }, []);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.warn("Auth persistence", e);
      }
      setAuthReady(true);
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        try {
          await loadProfile(firebaseUser);
        } catch (err) {
          console.error("Profile load error:", err);
        } finally {
          setLoading(false);
        }
      });
    })();
    return () => unsub();
  }, [loadProfile]);

  async function register(email, password, displayName, phone) {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone?.trim() || "";
    try {
      // Enforce unique phone number globally
      if (trimmedPhone) {
        const phoneExists = await isPhoneRegistered(trimmedPhone);
        if (phoneExists) {
          throw new Error("This mobile number is already registered. Please login.");
        }
      }
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateProfile(cred.user, { displayName: displayName.trim() });
      await saveUserProfile(cred.user.uid, {
        email: trimmedEmail,
        displayName: displayName.trim(),
        phone: trimmedPhone,
        phoneVerified: false,
        trustRating: 5.0,
        completedDeals: 0,
        role: "user",
        createdAt: serverTimestamp(),
      });
      await loadProfile(cred.user);
      return cred.user;
    } catch (err) {
      if (err.message?.includes("already registered")) throw err;
      if (err.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please login.");
      }
      throw new Error(getAuthErrorMessage(err.code || err.message));
    }
  }

  async function login(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const data = await loadProfile(cred.user);
      if (data?.suspended) {
        await signOut(auth);
        setUser(null);
        setProfile(null);
        throw new Error("Account suspended. Contact support at /support");
      }
      return cred.user;
    } catch (err) {
      throw new Error(getAuthErrorMessage(err.code || err.message));
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tk_logged_out", Date.now().toString());
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(getAuthErrorMessage(err.code || err.message));
    }
  }

  const isAdmin = profile?.role === "admin";
  const isSuspended = profile?.suspended === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading: loading || !authReady,
        register,
        login,
        logout,
        resetPassword,
        isAdmin,
        isSuspended,
        refreshProfile: () => (user ? loadProfile(user) : Promise.resolve()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

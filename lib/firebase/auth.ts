import { signInWithPopup, signOut, User, UserCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./config";

export async function google_sign_in() {
    const provider: GoogleAuthProvider = new GoogleAuthProvider();
    const credential: UserCredential = await signInWithPopup(auth, provider);
    const user: User = credential.user;
    console.log(user.uid);
}

export async function google_sign_out() {
    await signOut(auth);
    // also clear cookie server side
    console.log("Signed out")
}
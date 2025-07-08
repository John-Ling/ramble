import { User } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./config";


export async function write_entry(user: User, dbDate: string,  entry: JournalEntry) {
    // write an entry to firestore under user under dbDate as id
    const ref = doc(db, "users", user.uid, "entries", dbDate);
    await setDoc(ref, entry, {merge: true});
    console.log("wrote document");
    return;
}

export async function get_entry(user: User, dbDate: string) {
    // return the record in firestore for user under dbDate as id
    const ref = doc(db, "users", user.uid, "entries", dbDate);
    const docSnap = await getDoc(ref);

    if (docSnap.exists()) {
        console.log("Read success");
        return docSnap.data() as JournalEntry;
    } else {
        console.log("Document does not exist");
        return null;
    }
}

export async function get_n_entries(user: User, dbDate: string, n: number) {
    // returns the entry at dbDate along with n entries before and after it
    const entries: JournalEntry[] = [];
}
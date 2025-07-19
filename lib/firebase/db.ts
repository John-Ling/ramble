import { User } from "firebase/auth";
import { setDoc, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
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
    const ref = collection(db, "users", user.uid, "entries");
    console.log("Making DB call for ", dbDate);

    const beforeQuery = query(ref, where("created", '<', dbDate), orderBy("created", "desc"), limit(n));
    ((await getDocs(beforeQuery)).forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
    }));

    entries.reverse();
    
    // put add middle (current) entry
    entries.push({created: dbDate, content: "", favourite: false, tags: []} as JournalEntry);

    const afterQuery = query(ref, where("created", '>', dbDate), orderBy("created", "asc"), limit(n));

    ((await getDocs(afterQuery)).forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
    }))

    return entries;
}

export async function get_entries(user: User, dbDate: string, countBefore: number, countAfter: number) {  
    if (!user) {
      return null;
    }

    console.log("Making DB call");

    const before: JournalEntry[] = await get_n_before(user, dbDate, countBefore);
    const after: JournalEntry[] = await get_n_after(user, dbDate, countAfter);
    const entries: JournalEntry[] = [...before, {created: dbDate, content: "", favourite: false, tags: []} as JournalEntry, ...after];

    console.log("Entries");
    console.log(entries);
    return entries;
  }


export async function get_n_before(user: User, dbDate: string, n: number) {
    const entries: JournalEntry[] = [];
    const ref = collection(db, "users", user.uid, "entries");

    const beforeQuery = query(ref, where("created", '<', dbDate), orderBy("created", "desc"), limit(n));
    ((await getDocs(beforeQuery)).forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
    }));

    entries.reverse();

    console.log("Entries before");
    console.log(entries);
    return entries;
}

export async function get_n_after(user: User, dbDate: string, n: number) {
    const entries: JournalEntry[] = [];
    const ref = collection(db, "users", user.uid, "entries");
    const afterQuery = query(ref, where("created", '>', dbDate), orderBy("created", "asc"), limit(n));

    ((await getDocs(afterQuery)).forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
    }))

    console.log("Entries after");
    console.log(entries);
    return entries;
}
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

    // const beforeQuery = query("created", '<', dbDate).orderBy("created", "desc").limit(n)
    const beforeQuery = query(ref, where("created", '<', dbDate), orderBy("created", "asc"), limit(n));
    ((await getDocs(beforeQuery)).forEach((doc) => {
        console.log(doc.data());
        entries.push(doc.data() as JournalEntry);
    }));

    // get middle entry
    const middleEntry: JournalEntry | null = await get_entry(user, dbDate);
    if (!middleEntry) {
        return null;
    }
    entries.push(middleEntry);


    const afterQuery = query(ref, where("created", '>', dbDate), orderBy("created", "desc"), limit(n));

    ((await getDocs(afterQuery)).forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
    }))

    return entries;
}

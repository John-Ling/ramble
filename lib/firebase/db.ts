import { User } from "firebase/auth";
import { setDoc, doc, getDoc, collection, query, where, orderBy, limit, getDocs, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
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

export async function get_entries(user: User, dbDate: string, fetchCount: number = 12) {
    // attempt to pull fetchCount + 1 entries starting from dbDate including dbDate's own entry
    // fetchCount will be shown to the user but the last dbDate will be saved and hidden
    // it will be used as the next dbDate to pull future entries
    if (!user) return null;
    const entries: JournalEntry[] = [];
    const startDocument: JournalEntry | null = await get_entry(user, dbDate);

    if (startDocument) {
        entries.push(startDocument);
    } else {
        // document does not exist. create placeholder
        entries.push({ created: dbDate, content: "", favourite: false, tags: [] } as JournalEntry)
    }
    
    // try pull 11 documents for 12 viewable  + 1 extra to save as the next startDocument
    const ref = collection(db, "users", user.uid, "entries");
    const q = query(ref, where("created", '<', dbDate), orderBy("created", "desc"), limit(fetchCount));
    const response = await getDocs(q);

    response.forEach(doc => {
        entries.push(doc.data() as JournalEntry);
    });

    console.log(entries.length);
    
    let finalDocument: JournalEntry | undefined = undefined;
    if (entries.length == fetchCount + 1) {
        // remove final entry and keep track of it
        finalDocument = entries.pop();
    }

    return { entries: entries, startEntry: startDocument, endEntry: finalDocument}
}
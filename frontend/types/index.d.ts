interface JournalEntry {
    created: string; // acts as id
    authorID: string;
    content: string;
}

interface JournalEntryReference {
    _id: string; // _id is uid + created
    created: string; 
    name: string | null;
    favourite: boolean;
}
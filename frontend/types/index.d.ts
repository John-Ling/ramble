interface JournalEntry {
    created: string; // acts as id
    authorID: string;
    content: string;
}

interface JournalEntryReference {
    _id: string; 
    name: string | null;
    favourite: boolean;
}
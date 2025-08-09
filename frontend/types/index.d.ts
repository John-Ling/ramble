interface JournalEntry {
    created: string; // acts as id
    authorID: string;
    content: string;
    favourite: boolean;
}

interface JournalEntryReference {
    created: string;
    name: string | null;
    favourite: boolean;
}
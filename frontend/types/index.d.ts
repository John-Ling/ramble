interface JournalEntry {
    _id: string; // combine uuid and author id 
    content: string;
}

interface JournalEntryReference {
    _id: string; // combine uuid and author id 
    name: string | null;
    authorID: string;
    createdOn: string;
    favourite: boolean;
}
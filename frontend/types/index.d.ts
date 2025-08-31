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

interface JournalEntryReqBody {
    _id: string;
    name: string | null;
    authorID: string;
    createdOn: string;
    content: string;
}


interface GraphEmotion {
    emotion: string;
    colour: string;
    hidden: boolean;
}
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


interface DataPoint {
    name: string;
    neutral: number;
    joy: number;
    love: number;
    gratitude: number;
    excitement: number;
    relief: number;
    fear: number;
    amusement: number;
    disgust: number;
    caring: number;
    grief: number;
    anger: number;
    disappointment: number;
    remorse: number;
    embarrassment: number;
    curiosity: number;
    nervousness: number;
    desire: number;
    approval: number;
    confusion: number;
    optimism: number;
    surprise: number;
    annoyance: number;
    sadness: number;
    disapproval: number;
    realization: number;
    admiration: number;
}

interface VisibleEmotion extends GraphEmotion {
  visible: boolean;
}

// type represent the response from the backend
interface EmotionDataAPIResponse {
    datapoints: EmotionDataAPIDataPoint[];
}

// data point with additional data such as authorID and _id
// maybe store this later so user can click on points to view the entry 
interface EmotionDataAPIDataPoint extends DataPoint {
    _id: string;
    authorID: string;
    created: string;
}
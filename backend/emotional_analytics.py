from app import logger, emotionCollection
from _types import JournalEntryEmotionData

"""
Functions for extracting emotion scores 
for use with emotional analytics page
"""

# async def insert_emotion_scores(emotionData: JournalEntryEmotionData): 
#     document = await emotionCollection.find_one({"authorID": emotionData.authorID, "created": emotionData.created})

#     if document is not None:
#         # update
#         await emotionCollection.update_one({"authorID": emotionData.authorID, "created": emotionData.created}, {"$push", {""}})


def calculate_emotion_scores(chunks, classifier):
    emotionScores = {}
    for i, chunk in enumerate(chunks):
        labels = []
        modelOutputs = classifier(chunk)
        for output in modelOutputs[0]:
            emotion = output["label"]
            labels.append((emotion, output["score"]))
        
        labels = sorted(labels, key=lambda tuple: tuple[1], reverse=True)
        logger.info(f"INFORMATION FOR CHUNK {i}")
        logger.info(f"{chunk[0:50]} ... {chunk[-50:-1]}")
        for label in labels:
            emotion = str(label[0])
            score = float(label[1])
            logger.info(f"{emotion}: {score}")
            if emotion not in emotionScores:
                emotionScores[emotion] = [score]
                continue
            emotionScores[emotion].append(score)
    
    for label in emotionScores:
        logger.info(label)
        logger.info(emotionScores[label])
        #medianScore = statistics.median(emotionScores[label])

        # remove small values to prevent average from being fucked up
        total = 0
        validEmotionCount = 0
        for score in emotionScores[label]:
            if score < 0.01:
                continue
            total += score
            validEmotionCount += 1

        score = 0
        if validEmotionCount != 0:
            score = total / validEmotionCount
        emotionScores[label] = score

    return emotionScores

def generate_chunks(text, tokeniser):
    CHUNK_SIZE = 200
    CHUNK_OVERLAP = int(0.1 * CHUNK_SIZE)
    tokens = tokeniser.tokenize(text)
    tokenCount = len(tokens)
    chunks = []
    start = 0
    
    logger.info("Chunking")
    while start < tokenCount:
        end = min(start + CHUNK_SIZE, tokenCount)
        chunked = tokens[start:end]
        chunks.append(tokeniser.convert_tokens_to_string(chunked))
        
        # move start forward with overlap
        start += CHUNK_SIZE - CHUNK_OVERLAP
        if CHUNK_OVERLAP >= CHUNK_SIZE:
            start = end
    
    return chunks
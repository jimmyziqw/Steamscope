from google_play_scraper import reviews, Sort
from pathlib import Path
import sys
import logging
logger = logging.getLogger(__name__)

root_path = Path(__file__).parent.parent
sys.path.insert(0, root_path)
from src.data_pipeline.preprocess import lemmatize_doc
from src.web_scraper.steam_scraper import get_n_reviews

def load_data(id, platform, num_reviews):
    """scrap and preprocess reviews

    Args:
        id (int): _description_
        platform (str): _description_
        num_reviews (int): _description_

    Returns:
        dict: (review, lemmatized_review, sentiment)
    """
    if platform == "google-play":
        info = reviews(id, 
                        lang="en", 
                        country="us",
                        sort =Sort.NEWEST,
                        count=num_reviews)
        review_data = info[0]
        data = []
        for datum in review_data:
            lemmatized_review = lemmatize_doc(datum["content"])
            
            if len(lemmatized_review.split(" ")) > 5:
                data.append(dict(review=datum["content"],
                                lemmatized_review=lemmatized_review,
                                sentiment=datum["score"]))
    elif platform =="steam":
        review_data = get_n_reviews(id, num_reviews) 
        data = []
        for datum in review_data:
            review = datum["review"]
            lemmatized_review = lemmatize_doc(review)
            
            if len(review.split(" ")) >= 7 and \
                len(lemmatized_review.split(" "))>= 2 and \
                "☐" not in review:
                    
                data.append(dict(review=review,
                                lemmatized_review=lemmatized_review,
                                sentiment=1 if datum["voted_up"] else 0))
    else:
        print(f"platform does not match. platform:{platform}")      
            
    print(f"{len(data)} reviews collected...")
    logger.info(f"{len(data)} reviews collected...")
    return data
                    
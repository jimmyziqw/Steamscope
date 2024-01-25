from types import SimpleNamespace
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
from sklearn.manifold import TSNE
import logging

logger = logging.getLogger(__name__)


class TopicVisualizer:
    def __init__(self, args):
        self.args = args
        
    def __repr__(self):
        return str(self.args)
 
    def get_topics(self, docs:list, sentiment:list, vectorizer=None, model='nmf'):
        """generate keywords, frequency per topic
        Args:
            docs (list): preprocessed keywords
        Return:
            topic_keywords:[[(keyword, frequency), ...by NUM_KEYWORDS ...],
                            ... by NUM_TOPICS ...                         ]
                                                                                  
        """
        if len(docs)<15: # magic number is twice of default topic number
            raise ValueError(f"Not enough reviews to analyze. Current reviews: {len(docs)}")
            
        #fit topic model
        W, H = self._fit_nmf(docs)
        
        #compute topic_id(s) per doc
        doc_coordinates = self._reduce_dimension(W)
        topic_indices = self._assign_topic_ids(W) 
        doc_topic = [dict(x=doc_coordinates[i][0],
                          y=doc_coordinates[i][1],
                          topic_idx=topic_indices[i],
                          sentiment = sentiment[i]) for i in range(len(docs))]
        
        #get topic visualization data
        topic_info = self._get_topic_centers(doc_topic)
        
        #compute (keywords,frequency) per topic
        keywords_weights = self._get_keywords_weights(H)
            
        return topic_info, keywords_weights
    
    def _fit_nmf(self, docs):
        vectorizer = TfidfVectorizer(max_features=1000, 
                                    ngram_range=(1, 1), 
                                    min_df=2, 
                                    max_df=self.args.MAX_DF, 
                                    stop_words='english')
        
        X = vectorizer.fit_transform(docs)
        nmf = NMF(init=None, n_components=self.args.NUM_TOPICS, solver="mu", random_state=self.args.SEED)
        W = nmf.fit_transform(X) #(NUM_REVIEWS, NUM_TOPICS)
        H = nmf.components_ #(NUM_TOPICS, num_features)
        self.feature_names = vectorizer.get_feature_names_out()
        return W, H
    
    
    def _reduce_dimension(self, W):
        """reduce vectors to 2 dimension"""
        reducer = TSNE(n_components=2, perplexity=14, random_state=42, n_iter=300, n_iter_without_progress=50)
        doc_coordinates = reducer.fit_transform(W)
        return doc_coordinates

    def _assign_topic_ids(self, W, prob_threshold=0.5):
        """assign topic_id with probability greater than threshold"""
        topic_indices =[]
        for w in W:
            topic_probs = ev_to_prob(w)
            topic_id = np.where(topic_probs>prob_threshold)[0].tolist()
            topic_indices.append(topic_id)
        return topic_indices
    
    def _get_keywords_weights(self, H):
        #find top n keywords, keywords frequency per topics
        keywords_weights = [] 
        for weight in H:
            top_indices = np.argsort(weight)[:-self.args.NUM_KEYWORDS - 1:-1]
            top_n_keywords = []
            for idx in top_indices:
                top_n_keywords.append((self.feature_names[idx],weight[idx]))
            keywords_weights.append(top_n_keywords)
        return keywords_weights  
    
    def _get_topic_centers(self, doc_topic):
        #compute topic center coordinates and query sentiment distribution per topic
        import pandas as pd
        df = pd.DataFrame(doc_topic)
        new_rows = []
        for index, row in df.iterrows():
            topic_idx = row['topic_idx']
            x = row['x']
            y = row['y']
            topic_idx = row["topic_idx"]
            sentiment = row["sentiment"]
            for i in topic_idx:
                new_rows.append({'idx': index, 'x': x, 'y':y, "topic_idx":i, "sentiment":sentiment})

        df = pd.DataFrame(new_rows)
        df_ = df.groupby("topic_idx").agg({"x":"mean","y":"mean",'idx':"count"}).reset_index()
        df_["r"] = df_["idx"].apply(lambda x: float(x/len(doc_topic)))
        df_.drop("idx", axis=1, inplace=True)
        topic_centers = df_.to_dict(orient="records")
        sentiment = df.groupby(["topic_idx", "sentiment"])["idx"].count() #edge case: subgroup misses one sentiment
        sentiment = sentiment.to_dict()

        for k, v in sentiment.items():
            topic_idx, score = k
            
            curr_dict = topic_centers[topic_idx]
            if "sentiment" not in curr_dict.keys():
                curr_dict["sentiment"] = {score:v}
            else:
                curr_dict["sentiment"][score]=v
        return topic_centers

#transform array to [0, 1]
def min_max_scale(array, min=0, max=1):
    array_min = array.min()
    array_max = array.max()
    array_interval = array_max- array_min
    new_array = (array-array_min+min)/array_interval*(max-min)
    return new_array.tolist()    

#transform eigenvalue to probs
def ev_to_prob(array:list):
    array = np.array(array)
    if sum(array) != 0: #handle zero division
        return array/array.sum() 
    else:
        return array


args = SimpleNamespace()
args.NUM_REVIEWS = 5000
args.NUM_TOPICS = 5
args.NUM_KEYWORDS = 12
args.MAX_DF = 0.5
args.SEED = 44


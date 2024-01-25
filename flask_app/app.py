from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import logging
from datetime import datetime

# load local module
from src.topic_visualizer import args, TopicVisualizer
from src.data_pipeline.connect_mongo import ConnectMongo
from src.data_pipeline.preprocess import lemmatize_doc

# config the root logger
level = logging.INFO  
format = "%(asctime)s - %(filename)s - %(levelname)s - %(message)s"
logging.basicConfig(level=level, format=format)
logger = logging.getLogger(__name__)

# create app
app = Flask(__name__)
cors = CORS(app, resources = {"/*":{"origins":"*"}})

@app.route("/")
def index():
    return "Hello Gamers! "

@app.route("/<platform>/<id>/data", methods=["GET"])
def get_app_summary(platform, id):
    """get app summary
    platform: string
    id: int
    """
    TOPIC_NUM = 7
    MIN_REVIEW_NUM =30

    # get parameters 
    try:
        args.NUM_TOPICS = int(request.args.get("numOfTopics", TOPIC_NUM)) # specify a default value
    except ValueError:
        app.logger.error("NUM_TOPICS is not a number")
        return jsonify({"error": "NUM_TOPICS should be a number"}), 400
    
    
    query = json.loads(request.args.get("query", "{}")) # specify a default value
    logger.info(f"Request received. Id:{id}--Platform:{platform}--Query:{query}")
    
    # connect db
    mongo = ConnectMongo(db_name="steam", collection_name=id)
    if mongo.non_empty():
        data = mongo.get_data(query)
        if len(data) > MIN_REVIEW_NUM:
            sentiments = [record["sentiment"] for record in data]
            lemmatized_reviews =[record["lemmatized"] for record in data]
            model = TopicVisualizer(args)
            topic_info, keyword_weights = model.get_topics(lemmatized_reviews, sentiments)
            return jsonify({     
                            "bubble-chart-data": topic_info,
                            "keyword-weights":keyword_weights,
                            "reviews":data,                         
                            }), 200
        else:
            return jsonify({"errorMessage": f"Not enough reviews for topic modeling. Number of reviews: {len(data)}."}), 202
    else:
        return jsonify({}), 204
    
    
@app.route("/<platform>/<id>/data", methods=["POST"])
def post_app_summary(platform, id):
    data = request.get_json()  # get data sent in the request body
    logger.debug(f"data {data[0].keys()}--")
    if not data: 
        return jsonify({"error": "No data provided or data is not in JSON format"}), 400
    
    #get params 
    try:
        args.NUM_TOPICS = int(request.args.get("numOfTopics", )) # specify a default value
    except ValueError:
        app.logger.error("NUM_TOPICS is not a number")
        return jsonify({"error": "NUM_TOPICS should be a number"}), 400
    
    query = json.loads(request.args.get("query", "{}")) # specify a default value
    logger.info(f"Request received. Id:{id}--Platform:{platform}--Query:{query}")
    
    # check lemmatization
    if "lemmatized" not in data[0].keys():
        logger.info("lemmatizing...")
        for record in data:
            record["lemmatized"] = lemmatize_doc(record["review"])
    else:
        logger.info("lemmatized")    
        
    # get query
    if len(query): # if single sentiment is selected
        target_sentiment = query["sentiment"]
        
        lemmatized_reviews = [record["lemmatized"] for record in data if target_sentiment == record["sentiment"]]
        sentiments = [target_sentiment for _ in range(len(lemmatized_reviews))]  
        data = [dict(review = review,
                    sentiment = sentiment) 
                for (review, sentiment) in zip(lemmatized_reviews, sentiments)]
        
    else: # for mixed sentiment reviews   
        sentiments = [record["sentiment"] for record in data]
        lemmatized_reviews =[record["lemmatized"] for record in data]
    
    # save cleaned data in db
    mongo = ConnectMongo(db_name="steam", collection_name=str(id))
    collection = mongo.collection
    collection.insert_many(data)
    data = mongo.get_data(query)
    
    # run ML model
    model = TopicVisualizer(args)
    topic_info, keyword_weights = model.get_topics(lemmatized_reviews, sentiments)
    
    # check data format => lemmatization
    if 'lemmatized' not in data[0].keys() and not len(query): 
        print(data[0])
        raise KeyError(f"Key 'lemmatized' not found in the dictionary.")
    
    return jsonify({            
                    "bubble-chart-data": topic_info,
                    "keyword-weights":keyword_weights,
                    "reviews":data,                         
                    })
    

@app.route("/remove-word" , methods= ["POST"] )
def post_removal():
    word = request.get_json().get("word")  # get word sent in the request body
    if not word: 
        return jsonify({"error": "No word provided or data is not in JSON format"}), 400

    try:
        client_ip = request.remote_addr
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        word = {
            "client_ip": client_ip,
            "date": date,
            "word": word,
        }
        collection = ConnectMongo(db_name="remove_word", collection_name='v1')
        collection.insert_tracker(word)
        logger.info(f"add removal word {word}")
        return jsonify({
            "status": "success",
            "message": "Word added successfully",
        }), 200
    except Exception as e:
        app.logger.error(f"Error adding word: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while processing your request",
        }), 500
    
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8080)
    
    
    
    

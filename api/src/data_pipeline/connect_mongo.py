import pymongo
import os
import logging
logger = logging.getLogger(__name__)


class ConnectMongo():
    def __init__(self, db_name="tracker", collection_name="steam"):

        self.collection_name = collection_name
        AUTH_PATH = os.path.join("cred", "cred.txt")
        try: 
            with open(AUTH_PATH, "r") as f:
                username = f.readline().strip()
                password = f.readline().strip()
            
                uri = f"mongodb+srv://{username}:{password}@cluster0.m9bkn9t.mongodb.net/?retryWrites=true&w=majority"
        
        except FileNotFoundError:
            uri = "mongodb://localhost:27017/" 

            logger.warning(f"Mongodb cred not found!Insert at {os.getcwd()}")
            
        client = pymongo.MongoClient(uri)
        db = client[db_name]
        
        self.collection_names = db.list_collection_names()
        self.collection = db[collection_name]  
        logger.info("found collection in mongo")
        
    def non_empty(self):
        return self.collection_name in self.collection_names
    
    def get_data(self, query):
        if not query: 
            logger.debug("Query is empty.")
            data = self.collection.find({}, {"_id":0})
        else:
            data = self.collection.find(query, {"_id":0})  
        data = [x for x in data]
        logger.debug(f'Data found in db. Data: {data[0].keys() if data else "no data found"}')
        return data
    
    def insert_tracker(self, data):
        try: # Connect to MongoDB


            # Insert new data into the database
            self.collection.insert_one(data)
            logger.info(f"Data inserted")
            return {
                "status": "success",
                "message": "Data inserted successfully",
            }, 200
        except Exception as e:
            logger.error(f"Error inserting data: {str(e)}")
            return {
                "status": "error",
                "message": "An error occurred while processing your request",
            }, 500
            
            
    

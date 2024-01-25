import requests
from src.utils.timeit import timeit 

@timeit
def get_n_reviews(appid:int, n:int):
    """consume steam api and get reviews
    Args:
        appid (int): check from https://store.steampowered.com/appreviews/<appid>
        n (int): number of reviews

    Returns:
        list: review records
    """
    
    def get_reviews(appid:int, params={'json':1}):
        #define single request from steam api
        url = f'https://store.steampowered.com/appreviews/{appid}'
        response = requests.get(url=url, params=params, headers=None)
        return response.json()
    
    #append responses to list
    reviews = []
    params = {
            'json' : 1,
            'filter' : 'recent',  #default "all" yields duplicated data, not recommended
            'language' : 'english', 
            'day_range' : None,
            'review_type' : 'all',
            'purchase_type' : 'all' 
            }
    cursor = '*'   
    num_requests = n // 100 +1 #set request at maximum rate (100 data per request)
    
    for idx in range(num_requests):
        params['cursor'] = cursor.encode()
        if idx == num_requests - 1:
            params["num_per_page"] = n % 100
        else:
            params['num_per_page'] = 100
            
        response = get_reviews(appid, params)
        cursor = response['cursor']      
        reviews += response['reviews']

    return reviews



    

   
    
  




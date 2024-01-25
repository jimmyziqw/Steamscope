import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
import logging
import os

#remove stop words
from nltk.corpus import stopwords
logger = logging.getLogger(__name__)

# add removal list
REMOVAL_PATH = os.path.join("src", "data_pipeline", "user_def_removal.txt")

#check if nltk downloaded
try:
    stopwords.words('english')
    logger.info("stopwords exists")
except LookupError:
    print("Stopwords not found. Downloading now...")
    nltk.download('stopwords')
    nltk.download('punkt')
    nltk.download('wordnet')
    nltk.download('averaged_perceptron_tagger')
    logger.debug("Stopwords downloaded successfully.")    

stopwords = nltk.corpus.stopwords.words('english')  
def stopword_removal(words):
    return [word for word in words if word not in stopwords]

def read_words_from_file(filename):
    with open(filename, 'r') as file:
        words = [line.strip() for line in file]
    return words

# Function to convert NLTK's POS tag to WordNet POS tag
def get_wordnet_pos(treebank_tag):
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('N'):
        return wordnet.NOUN
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    else:
        return wordnet.NOUN
    
#Function to lemmatize a list of documents and only keep nouns
removal_list = read_words_from_file(REMOVAL_PATH)  
lemmatizer = WordNetLemmatizer()
def lemmatize_doc(document):
        document = document.lower()
        sentences = sent_tokenize(document)
        lemmatized_sentences = []
        for sentence in sentences:
            words = word_tokenize(sentence)
            pos_tags = nltk.pos_tag(words)
            lemmatized_words = [
                lemmatizer.lemmatize(word, pos=get_wordnet_pos(pos))
                for word, pos in pos_tags
                if get_wordnet_pos(pos) in [wordnet.NOUN]
            ]
            #remove non-alphabetic words
            lemmatized_words = [word for word in lemmatized_words\
                                    if word not in removal_list and word.isalpha()]
            
            lemmatized_sentence = ' '.join(lemmatized_words)
            lemmatized_sentences.append(lemmatized_sentence)
          
        lemmatized_document = ' '.join(lemmatized_sentences)
        
        return lemmatized_document

stemmer = nltk.stem.porter.PorterStemmer()   
def stemming(words):
    words_out =  [stemmer.stem(word) for word in words]
    return words_out

#punctuation removal
def punctuation_removal(words):
    return [word for word in words if word.isalpha()]

# some basic normalization
def light_clean(doc):
    """
    :param s: string to be processed
    :return: processed string: see comments in the source code for more info
    """
    doc = re.sub('[^\x00-\x7F]', '', doc) #remove non ascii characters e.g. steam dot art
    doc = re.sub(r'(.{2,}?)\1+', r'\1', doc) #remove repeting pattern e.g. gamers spam and troll a lot
    #doc = re.sub('[E|e]arly access review|product receive free|receive free','', doc) #removing steam tags
    doc = re.sub('\d{1,2}\/\d{1,2}','', doc)
    return doc
 
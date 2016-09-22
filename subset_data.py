import ast
import json
import os
from multiprocessing import Pool
import operator
from string import ascii_lowercase
from time import time
from wordcloud import WordCloud


# TODO: Create a proper subset of data for easier testing
# TODO: Organize comments into smaller data files for easier individual subreddit analysis
# TODO: Integrate word clouds into the main analysis

# Sentiment analysis words
positive_emotion_words = []
negative_emotion_words = []

'''
Initialize the sentiment word lists for each multiprocess instance
'''
def initializeDataSets():
    fileNames = {'sentiment/positive_emotions.txt': positive_emotion_words, 'sentiment/negative_emotions.txt': negative_emotion_words}

    # Read in all files and add the words
    # to the reference of the master data set variable lists
    for item in fileNames.items():
        file_name = item[0]
        dataset = item[1]
        file = open(file_name)
        list_string = file.read()
        read_in_list = ast.literal_eval(list_string)

        # Remove duplicates in the list
        read_in_list = set(read_in_list)
        
        dataset.extend(read_in_list)

"""
Yield successive n-sized chunks from l. Used to split up comment list
[] -> [[], [] ...]
"""
def chunks(l, n):
    for i in xrange(0, len(l), n):
        yield l[i:i+n]

'''
Given two dicts, merge them into a new dict as a shallow copy.
Used to aggregate dictionaries of counts
'''
def merge_two_count_dicts(x, y):
    z = x.copy()
    for key, value in y.items():
        if (key not in z):
            z[key] = value
        else:
            z[key] = z[key] + value
    return z

'''
Gets counts of words fom lookup_list in text, storing
the counts in count_dict
'''
def compute_count(text, lookup_list, count_dict):
    words = text.split(' ')
    for word in words:
        for pattern in lookup_list:
            #If there is a wildcard, we remove it
            #and just find if the word starts with it
            #Here we keep a copy of the original
            original_pattern = pattern

            hasAsterisk = False
            #Remove the asterisk from wildcards
            if ('*' in pattern):
                pattern = pattern.replace('*', '')
                hasAsterisk = True
            #One data set has apparent and apparently in a marker set that has
            #words containing asterisks. We don't want apparently to count for apparent
            if ((hasAsterisk and word.startswith(pattern)) or (not hasAsterisk and word == original_pattern)):
                if (original_pattern in count_dict):
                    count_dict[original_pattern] =  count_dict[original_pattern] + 1
                else:
                    count_dict[original_pattern] = 1
    return count_dict

def compute_positive_emotions(text, count_dict):
    return compute_count(text, positive_emotion_words, count_dict)

def compute_negative_emotions(text, count_dict):
    return compute_count(text, negative_emotion_words, count_dict)

"""
Multiprocessing returns a list of lists
with results of each pool process
Combine all the pool results into a flat list
"""
def aggregate_results(results):
    merged_dict = {}
    aggregated = []
    for feature_index in range(len(results[0])):
        feature_sum = 0
        for pool_result_index in range(len(results)):
            if (type(results[pool_result_index][feature_index]) == dict):
                merged_dict = merge_two_count_dicts(merged_dict, results[pool_result_index][feature_index])
                isDict = True
            else:
                isDict = False
                feature_sum += results[pool_result_index][feature_index]
        if (isDict):
            aggregated.append(merged_dict)
        else:
            aggregated.append(feature_sum)
    return aggregated

"""
Every comment is passed through here. Define all
the analysis to be done here
Input: comments is a list of comments
Returns: A list of comment features
0: number of words
1: length of comment
2: number of comments processed
3: Positive word counts
4: Negative word counts
"""
def compute_comments(comments):
    # Load the sentiment words for this multiprocess instance
    initializeDataSets()

    positive_emotions_total = dict.fromkeys(positive_emotion_words, 0)
    negative_emotions_total = dict.fromkeys(negative_emotion_words, 0)

    word_count = 0
    text_length = 0
    for comment in comments:
        text = comment['body']
        words = text.split()

        word_count += len(words)
        text_length += len(text)
        compute_positive_emotions(text, positive_emotions_total)
        compute_negative_emotions(text, negative_emotions_total)

    return [word_count, text_length, len(comments), positive_emotions_total, negative_emotions_total]


def process_comments():
    # Number of processes to spawn for comment computation
    NUM_POOLS = 10

    # Number of comments to gather before starting multiprocessing
    multiprocess_size = 250000  
    multiprocess_size = 1000

    # One comment JSON per line. File format:
    # {"gilded":0,"author_flair_text":"Male","author_flair_css_class":"male","retrieved_on":1425124228,"ups":3,"subreddit_id":"t5_2s30g","edited":false,"controversiality":0,"parent_id":"t1_cnapn0k","subreddit":"AskMen","body":"I can't agree with passing the blame, but I'm glad to hear it's at least helping you with the anxiety. I went the other direction and started taking responsibility for everything. I had to realize that people make mistakes including myself and it's gonna be alright. I don't have to be shackled to my mistakes and I don't have to be afraid of making them. ","created_utc":"1420070668","downs":0,"score":3,"author":"TheDukeofEtown","archived":false,"distinguished":null,"id":"cnasd6x","score_hidden":false,"name":"t1_cnasd6x","link_id":"t3_2qyhmp"}

    # Data file is 32GB
    # 69,654,819 comments
    #data_file_name = 'RC_2016-08'
    data_file_name = 'data/test_data.txt'
    data_file = open(data_file_name, 'r')

    start_time = time()
    comment_counter = 0 # Count total comments
    process_counter = 0 # Count current comment chunk size for multiprocessing

    overall_stats = [0] * 3 + [{}] * 2
    comment_list = []

    #Parse the lines with the comment data
    for comment_line in data_file:

    	comment_line = comment_line.rstrip()
        comment_json = json.loads(comment_line)
        comment_list.append(comment_json)
        comment_counter += 1
        process_counter += 1

        if (process_counter > multiprocess_size):
            
            overall_stats = multiprocess(comment_list, NUM_POOLS, process_counter, overall_stats)

            process_counter = 0
            comment_list = []
            print('Resuming comment gathering')

    # Catch any remaining comments
    if (process_counter > 0):
        overall_stats = multiprocess(comment_list, NUM_POOLS, process_counter, overall_stats)

    end_time = time()
    print('Took {} seconds to process all {} comments'.format(end_time - start_time, comment_counter))
    print("""
    Overall words: {}
    Overall text lengths: {}
    Number of comments: {}
    Positive: {}
    Negative: {}
    """.format(overall_stats[0], overall_stats[1], overall_stats[2], overall_stats[3], overall_stats[4]))


"""
Initiate the child processes
"""
def multiprocess(comment_list, NUM_POOLS, process_counter, overall_stats):
    process_start_time = time()

    print('Reached {} comments. Firing off comment analysis processes'.format(process_counter))

    comment_chunks = list(chunks(comment_list, process_counter / NUM_POOLS))
    pool = Pool()

    # The map function takes in an iterable and sends
    # the chunks into separate processes
    results = pool.map(compute_comments, comment_chunks)

    # Wait for it to be done
    pool.close()
    pool.join()

    process_end_time = time()
    print('Took {} seconds to multiprocess {} comments'.format(process_end_time - process_start_time, process_counter))

    pool_results = aggregate_results(results)
    overall_stats = [merge_two_count_dicts(x, y) if type(x) == dict else x + y for x, y in zip(pool_results, overall_stats)]
    return overall_stats


"""
Check the top occurring subreddits in the first comment_limit comments
Test
"""
def top_occurring():
    
    data_file_name = 'data/test_data.txt'
    data_file = open(data_file_name, 'r')
    comment_limit = 1000000
    subreddits = dict()
    counter = 0
    t0 = time()

    for line in data_file:
        counter += 1
        if (counter > comment_limit):
            break
        line = line.rstrip()
        comment = json.loads(line)
        subreddit = comment['subreddit']
        if subreddit in subreddits:
            subreddits[subreddit] += 1
        else:
            subreddits[subreddit] = 1

    sorted_subreddits = sorted(subreddits.items(), reverse=True, key=operator.itemgetter(1))
    for entry in sorted_subreddits[:100]:
        print('{subreddit}: {count}'.format(subreddit=entry[0], count=entry[1]))

    print('Number of subreddits found in first {comment_limit} comments: {num_comments}'.format(comment_limit=comment_limit, num_comments=len(sorted_subreddits)))  

    print('Took {} seconds to process the comments'.format(time() - t0))

"""
Create word clouds for some comments
Test
"""
def word_clouds():
    data_file_name = 'data/test_data.txt'
    data_file = open(data_file_name, 'r')
    comment_limit = 10000
    counter = 0
    texts = []

    for line in data_file:
        counter += 1
        if (counter > comment_limit):
            break
        line = line.rstrip()
        comment = json.loads(line)
        subreddit = comment['subreddit']
        texts.append(comment['body'])
        

    wordcloud = WordCloud().generate(' '.join(texts))

    # Display the generated image:
    # the matplotlib way:
    import matplotlib.pyplot as plt
    plt.imshow(wordcloud)
    plt.axis("off")
    plt.show()
    # Example: https://github.com/amueller/word_cloud/blob/master/examples/simple.py


"""
Convert the large data file into a bunch of smaller files partitioned
by letter the subreddit starts with
"""
def partition_subreddits():

    letter_file = None

    data_file_name = 'data/test_data.txt'
    data_file = open(data_file_name, 'r')
    chunk_size = 10000
    counter = 0
    comments = []

    for line in data_file:
        counter += 1
        line = line.rstrip()
        comment = json.loads(line)
        comments.append(comment)

        if (counter > chunk_size):
            comments.sort(key=lambda x: x['subreddit'])
            letter_index = 0
            letter_file = open('data/' + ascii_lowercase[letter_index], 'w')
            for comment in comments:

                if (comment['subreddit'][0].lower() != ascii_lowercase[letter_index]):
                    while (comment['subreddit'][0].lower() != ascii_lowercase[letter_index]):
                        letter_index += 1
                    letter_file.close()
                    letter_file = open('data/' + ascii_lowercase[letter_index], 'w')
                letter_file.write(json.dumps(comment) + '\n')
            counter = 0
            comments = []
            letter_file.close()
    

if __name__ == "__main__":
    #top_occurring()
    #word_clouds()
    #process_comments()
    #partition_subreddits()
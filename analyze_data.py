import ast
import datetime
from dateutil import tz
import json
import os
import re
from multiprocessing import Pool
import operator
import pickle
from string import ascii_lowercase
import sys
from time import time
from wordcloud import WordCloud

MONTH_FILES = ['RC_2016-01', 'RC_2016-08']
MONTH_FILE = 'RC_2016-01'
LOOKUP_PATH = 'lookup_data'
RESULTS_PATH = 'results'

# Sentiment analysis words
positive_emotion_words = set()
negative_emotion_words = set()
godwins_law_words = set()

POSITIVE_MULTIPLIER = 1000
NEGATIVE_MULTIPLIER = 1000
GODWIN_MULTIPLIER = 10000000

# Number of processes to spawn for comment computation
NUM_POOLS = 5

SUBREDDITS = [
        'AskReddit',
        'politics',
        'NoMansSkyTheGame',
        'pokemongo',
        'Overwatch',
        'The_Donald',
        'leagueoflegends',
        'worldnews',
        'SquaredCircle',
        'news',
        'funny',
        'DotA2',
        'videos',
        'movies',
        'pics',
        'soccer',
        'pcmasterrace',
        'gaming',
        'todayilearned',
        'nfl',
        'wow',
        'GlobalOffensive',
        'nba',
        'gifs',
        'relationships',
        'Showerthoughts',
        'MMA',
        'olympics',
        'hearthstone',
        'DestinyTheGame',
        'BigBrother',
        'pokemontrades',
        'WTF',
        'AdviceAnimals',
        'anime',
        'CFB',
        'GlobalOffensiveTrade',
        'hiphopheads',
        'friendsafari',
        'TheSilphRoad',
        'Games',
        'stevenuniverse',
        'pokemon',
        'baseball',
        'buildapc',
        '2007scape',
        'fantasyfootball',
        'aww',
        'Fitness',
        'jailbreak',
    ]

"""
Initialize the sentiment word lists for each multiprocess instance
"""
def initialize_data_sets():
    fileNames = {'sentiment/positive_emotions.txt': positive_emotion_words, 'sentiment/negative_emotions.txt': negative_emotion_words, 'sentiment/godwins_law_words.txt': godwins_law_words}

    # Read in all files and add the words
    # to the reference of the master data set variable lists
    for item in fileNames.items():
        file_name = item[0]
        dataset = item[1]
        file = open(file_name)
        list_string = file.read()
        read_in_list = ast.literal_eval(list_string)
        # Remove duplicates as well
        dataset.update(set(read_in_list))

"""
Yield successive n-sized chunks from l. Used to split up comment list
[] -> [[], [] ...]
"""
def chunks(l, n):
    for i in xrange(0, len(l), n):
        yield l[i:i+n]

"""
Given two dicts, merge them into a new dict as a shallow copy.
Used to aggregate dictionaries of counts
"""
def merge_two_count_dicts(x, y):
    z = x.copy()
    for key, value in y.items():
        if (key not in z):
            z[key] = value
        else:
            z[key] = z[key] + value
    return z

"""
Gets counts of words fom lookup_list in text, storing
the counts in count_dict
"""
def compute_count(text, lookup_list, count_dict):
    words = text.split()
    for word in words:
        if word.lower() in lookup_list:
            if (word.lower() in count_dict):
                count_dict[word.lower()] =  count_dict[word.lower()] + 1
            else:
                count_dict[word.lower()] = 1
    count_dict

def compute_positive_emotions(text, count_dict):
    compute_count(text, positive_emotion_words, count_dict)

def compute_negative_emotions(text, count_dict):
    compute_count(text, negative_emotion_words, count_dict)

def compute_godwin(text, count_dict):
    compute_count(text, godwins_law_words, count_dict)

def compute_time_buckets(timestamp, count_dict):
    from_zone = tz.gettz('UTC')
    to_zone = tz.gettz('America/New_York')
    date = datetime.datetime.fromtimestamp(timestamp)
    date = date.replace(tzinfo=from_zone)
    date = date.astimezone(to_zone)
    if date.day < 29:
        count_dict[(date.weekday(), date.hour)] += 1

"""
Get all /r/subreddit references
"""
def compute_subreddit_refs(text, count_dict):
    pattern = re.compile('r/[\w]+')
    matches = pattern.findall(text)
    matches = [match.split('/')[1] for match in matches]
    for match in matches:
        match = match.lower()
        if match in count_dict:
            count_dict[match] += 1

"""
Multiprocessing returns a list of lists
with results of each pool process
Combine all the pool results into a flat list
"""
def aggregate_results(results):
    aggregated = []
    for feature_index in range(len(results[0])):
        merged_dict = {}
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
Retrieves the comment score percentiles for the subreddit
"""
def get_subreddit_comment_percentiles(subreddit):
    lookup_path = 'lookup_data'
    with open(os.path.join(LOOKUP_PATH, 'comment_percentiles_{}.json'.format(MONTH_FILE)), 'r') as percentiles_file:
        percentiles = json.load(percentiles_file)
    low, high = percentiles[subreddit].split(',')
    return (int(low), int(high))

"""
Retrieves set of top authors for the subreddit
"""
def get_top_authors(subreddit):
    with open(os.path.join(LOOKUP_PATH, 'top_authors_{}.p'.format(MONTH_FILE)), 'rb') as output:
        return pickle.load(output)[subreddit]

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
    initialize_data_sets()
    subreddit = comments[0]['subreddit']
    lower_percentile, upper_percentile = get_subreddit_comment_percentiles(subreddit)
    top_authors = get_top_authors(subreddit)
    subreddit_mentions = {subreddit.lower(): 0 for subreddit in SUBREDDITS}

    positive_emotions_total = dict.fromkeys(positive_emotion_words, 0)
    negative_emotions_total = dict.fromkeys(negative_emotion_words, 0)
    godwins_law_total = dict.fromkeys(godwins_law_words, 0)

    positive_emotions_total_topcom = positive_emotions_total.copy()
    negative_emotions_total_topcom = negative_emotions_total.copy()
    godwins_law_total_topcom = godwins_law_total.copy()

    positive_emotions_total_botcom = positive_emotions_total.copy()
    negative_emotions_total_botcom = negative_emotions_total.copy()
    godwins_law_total_botcom = godwins_law_total.copy()

    positive_emotions_total_topauth = positive_emotions_total.copy()
    negative_emotions_total_topauth = negative_emotions_total.copy()
    godwins_law_total_topauth = godwins_law_total.copy()

    time_buckets = dict()
    for weekday in range(7):
        for hour in range(24):
            time_buckets[(weekday, hour)] = 0

    time_buckets_topcom = time_buckets.copy()
    time_buckets_botcom = time_buckets.copy()
    time_buckets_topauth = time_buckets.copy()

    counter = 0

    word_count = 0
    text_length = 0

    word_count_topcom = 0
    text_length_topcom = 0

    word_count_botcom = 0
    text_length_botcom = 0

    word_count_topauth = 0
    text_length_topauth = 0

    comments_topcom = 0
    comments_botcom = 0
    comments_topauth = 0
    for comment in comments:
        if counter % 25000 == 0:
            print("At comment {} for some multiprocess".format(counter))
            sys.stdout.flush()
        counter += 1
        text = comment['body']
        score = int(comment['score'])
        author = comment['author']
        words = text.split()

        compute_subreddit_refs(text, subreddit_mentions)

        word_count += len(words)
        text_length += len(text)
        compute_positive_emotions(text, positive_emotions_total)
        compute_negative_emotions(text, negative_emotions_total)
        compute_godwin(text, godwins_law_total)

        timestamp = int(comment['created_utc'])
        compute_time_buckets(timestamp, time_buckets)

        if score > upper_percentile:
            word_count_topcom += len(words)
            text_length_topcom += len(text)
            compute_positive_emotions(text, positive_emotions_total_topcom)
            compute_negative_emotions(text, negative_emotions_total_topcom)
            compute_godwin(text, godwins_law_total_topcom)

            compute_time_buckets(timestamp, time_buckets_topcom)
            comments_topcom += 1

        if score < lower_percentile:
            word_count_botcom += len(words)
            text_length_botcom += len(text)
            compute_positive_emotions(text, positive_emotions_total_botcom)
            compute_negative_emotions(text, negative_emotions_total_botcom)
            compute_godwin(text, godwins_law_total_botcom)

            compute_time_buckets(timestamp, time_buckets_botcom)
            comments_botcom += 1

        if author in top_authors:
            word_count_topauth += len(words)
            text_length_topauth += len(text)
            compute_positive_emotions(text, positive_emotions_total_topauth)
            compute_negative_emotions(text, negative_emotions_total_topauth)
            compute_godwin(text, godwins_law_total_topauth)

            compute_time_buckets(timestamp, time_buckets_topauth)
            comments_topauth += 1

    return [
        word_count, text_length, len(comments), positive_emotions_total, negative_emotions_total, godwins_law_total, time_buckets, subreddit_mentions,
        word_count_topcom, text_length_topcom, comments_topcom, positive_emotions_total_topcom, negative_emotions_total_topcom, godwins_law_total_topcom, time_buckets_topcom,
        word_count_botcom, text_length_botcom, comments_botcom, positive_emotions_total_botcom, negative_emotions_total_botcom, godwins_law_total_botcom, time_buckets_botcom,
        word_count_topauth, text_length_topauth, comments_topauth, positive_emotions_total_topauth, negative_emotions_total_topauth, godwins_law_total_topauth, time_buckets_topauth
    ]


"""
Master analysis function. Calculates stats for all subreddits
"""
def process_comments():
    # One comment JSON per line. File format:
    # {"gilded":0,"author_flair_text":"Male","author_flair_css_class":"male","retrieved_on":1425124228,"ups":3,"subreddit_id":"t5_2s30g","edited":false,"controversiality":0,"parent_id":"t1_cnapn0k","subreddit":"AskMen","body":"I can't agree with passing the blame, but I'm glad to hear it's at least helping you with the anxiety. I went the other direction and started taking responsibility for everything. I had to realize that people make mistakes including myself and it's gonna be alright. I don't have to be shackled to my mistakes and I don't have to be afraid of making them. ","created_utc":"1420070668","downs":0,"score":3,"author":"TheDukeofEtown","archived":false,"distinguished":null,"id":"cnasd6x","score_hidden":false,"name":"t1_cnasd6x","link_id":"t3_2qyhmp"}

    # Data file is 32GB
    # 69,654,819 comments
    
    path = os.path.join('data', MONTH_FILE, 'by_subreddit')

    sort_sentiment_dicts()
    final_csv_file = open("reddit_{}.csv".format(MONTH_FILE), 'w')
    final_csv_file.write("subreddit,num_comments,num_words,num_chars,avg_word_length,avg_words_per_comment,positive_score,negative_score,godwins_score,"
                         "num_comments_topcom,num_words_topcom,num_chars_topcom,avg_word_length_topcom,avg_words_per_comment_topcom,positive_score_topcom,negative_score_topcom,godwins_score_topcom,"
                         "num_comments_botcom,num_words_botcom,num_chars_botcom,avg_word_length_botcom,avg_words_per_comment_botcom,positive_score_botcom,negative_score_botcom,godwins_score_botcom,"
                         "num_comments_topauth,num_words_topauth,num_chars_topauth,avg_word_length_topauth,avg_words_per_comment_topauth,positive_score_topauth,negative_score_topauth,godwins_score_topauth\n")
    
    time_csv_file = open('reddit_{}_time_series.csv'.format(MONTH_FILE), 'w')
    time_csv_file.write('subreddit,weekday,hour,count,count_topcom,count_botcom,count_topauth\n')

    mention_adjacency_matrix = dict()

    for subreddit in reversed(SUBREDDITS):

        start_time = time()
        comment_counter = 0  # Count total comments

        overall_stats = [0] * 3 + [{}] * 5 + [0] * 3 + [{}] * 4 + [0] * 3 + [{}] * 4 + [0] * 3 + [{}] * 4  # Must match the features array in type and length
        comment_list = []

        data_file_name = os.path.join(path, subreddit[0].lower() + '.sorted')
        data_file = open(data_file_name, 'r')

        print("Looking for r/{} comments in file {}".format(subreddit, data_file_name))

        found_subreddit = False

        #Parse the lines with the comment data
        for comment_line in data_file:
            comment_line = comment_line.rstrip()
            comment_json = json.loads(comment_line)
            if comment_json['subreddit'] == subreddit:
                if not found_subreddit:
                    print("Found r/{} comments".format(subreddit))
                found_subreddit = True

                comment_list.append(comment_json)
                comment_counter += 1

            else:
                if found_subreddit == True:
                    break

        print("Sending r/{} comments for multiprocessing analysis".format(subreddit))
        overall_stats = multiprocess(comment_list, NUM_POOLS, overall_stats)

        end_time = time()
        print('Took {} seconds to process {} comments for r/{}'.format(end_time - start_time, comment_counter, subreddit))

        final_formatter(subreddit, overall_stats, final_csv_file, time_csv_file)
        mention_adjacency_matrix[subreddit] = overall_stats[7]
        print(overall_stats[7])

    final_csv_file.close()

    print(mention_adjacency_matrix)
    with open(os.path.join(LOOKUP_PATH, 'mention_adj_matrix.p'), 'wb') as output:
        pickle.dump(mention_adjacency_matrix, output)
        

"""
Takes the final output per subreddit and writes the
data to the given file handle
"""
def final_formatter(subreddit, overall_stats, final_handle, time_handle):
    positive_counts = sorted(overall_stats[3].items(), reverse=True, key=operator.itemgetter(1))
    positive_sum = sum(pair[1] for pair in positive_counts)
    negative_counts = sorted(overall_stats[4].items(), reverse=True, key=operator.itemgetter(1))
    negative_sum = sum(pair[1] for pair in negative_counts)
    godwins_law_counts = sorted(overall_stats[5].items(), reverse=True, key=operator.itemgetter(1))
    godwins_law_sum = sum(pair[1] for pair in godwins_law_counts)

    num_words = overall_stats[0]
    text_lengths = overall_stats[1]
    num_comments = overall_stats[2]

    avg_word_length = text_lengths / float(num_words)
    avg_words_per_comment = num_words / float(num_comments)

    positive_score = POSITIVE_MULTIPLIER * positive_sum / float(num_words)
    negative_score = NEGATIVE_MULTIPLIER * negative_sum / float(num_words)
    godwins_score = GODWIN_MULTIPLIER * godwins_law_sum / float(num_words)

    time_buckets = overall_stats[6]


    positive_counts_topcom = sorted(overall_stats[11].items(), reverse=True, key=operator.itemgetter(1))
    positive_sum_topcom = sum(pair[1] for pair in positive_counts_topcom)
    negative_counts_topcom = sorted(overall_stats[12].items(), reverse=True, key=operator.itemgetter(1))
    negative_sum_topcom = sum(pair[1] for pair in negative_counts_topcom)
    godwins_law_counts_topcom = sorted(overall_stats[13].items(), reverse=True, key=operator.itemgetter(1))
    godwins_law_sum_topcom = sum(pair[1] for pair in godwins_law_counts_topcom)

    num_words_topcom = overall_stats[8]
    text_lengths_topcom = overall_stats[9]
    num_comments_topcom = overall_stats[10]

    avg_word_length_topcom = text_lengths_topcom / float(num_words_topcom)
    avg_words_per_comment_topcom = num_words_topcom / float(num_comments_topcom)

    positive_score_topcom = POSITIVE_MULTIPLIER * positive_sum_topcom / float(num_words_topcom)
    negative_score_topcom = NEGATIVE_MULTIPLIER * negative_sum_topcom / float(num_words_topcom)
    godwins_score_topcom = GODWIN_MULTIPLIER * godwins_law_sum_topcom / float(num_words_topcom)

    time_buckets_topcom = overall_stats[14]


    positive_counts_botcom = sorted(overall_stats[18].items(), reverse=True, key=operator.itemgetter(1))
    positive_sum_botcom = sum(pair[1] for pair in positive_counts_botcom)
    negative_counts_botcom = sorted(overall_stats[19].items(), reverse=True, key=operator.itemgetter(1))
    negative_sum_botcom = sum(pair[1] for pair in negative_counts_botcom)
    godwins_law_counts_botcom = sorted(overall_stats[20].items(), reverse=True, key=operator.itemgetter(1))
    godwins_law_sum_botcom = sum(pair[1] for pair in godwins_law_counts_botcom)

    num_words_botcom = overall_stats[15]
    text_lengths_botcom = overall_stats[16]
    num_comments_botcom = overall_stats[17]

    avg_word_length_botcom = text_lengths_botcom / float(num_words_botcom)
    avg_words_per_comment_botcom = num_words_botcom / float(num_comments_botcom)

    positive_score_botcom = POSITIVE_MULTIPLIER * positive_sum_botcom / float(num_words_botcom)
    negative_score_botcom = NEGATIVE_MULTIPLIER * negative_sum_botcom / float(num_words_botcom)
    godwins_score_botcom = GODWIN_MULTIPLIER * godwins_law_sum_botcom / float(num_words_botcom)

    time_buckets_botcom = overall_stats[21]


    positive_counts_topauth = sorted(overall_stats[25].items(), reverse=True, key=operator.itemgetter(1))
    positive_sum_topauth = sum(pair[1] for pair in positive_counts_topauth)
    negative_counts_topauth = sorted(overall_stats[26].items(), reverse=True, key=operator.itemgetter(1))
    negative_sum_topauth = sum(pair[1] for pair in negative_counts_topauth)
    godwins_law_counts_topauth = sorted(overall_stats[27].items(), reverse=True, key=operator.itemgetter(1))
    godwins_law_sum_topauth = sum(pair[1] for pair in godwins_law_counts_topauth)

    num_words_topauth = overall_stats[22]
    text_lengths_topauth = overall_stats[23]
    num_comments_topauth = overall_stats[24]

    avg_word_length_topauth = text_lengths_topauth / float(num_words_topauth)
    avg_words_per_comment_topauth = num_words_topauth / float(num_comments_topauth)

    positive_score_topauth = POSITIVE_MULTIPLIER * positive_sum_topauth / float(num_words_topauth)
    negative_score_topauth = NEGATIVE_MULTIPLIER * negative_sum_topauth / float(num_words_topauth)
    godwins_score_topauth = GODWIN_MULTIPLIER * godwins_law_sum_topauth / float(num_words_topauth)

    time_buckets_topauth = overall_stats[28]

    template = ("{subreddit},{num_comments},{num_words},{num_chars},"
                "{avg_word_length},{avg_words_per_comment},{positive_score},"
                "{negative_score},{godwins_score},"
                "{num_comments_topcom},{num_words_topcom},{num_chars_topcom},"
                "{avg_word_length_topcom},{avg_words_per_comment_topcom},{positive_score_topcom},"
                "{negative_score_topcom},{godwins_score_topcom},"
                "{num_comments_botcom},{num_words_botcom},{num_chars_botcom},"
                "{avg_word_length_botcom},{avg_words_per_comment_botcom},{positive_score_botcom},"
                "{negative_score_botcom},{godwins_score_botcom},"
                "{num_comments_topauth},{num_words_topauth},{num_chars_topauth},"
                "{avg_word_length_topauth},{avg_words_per_comment_topauth},{positive_score_topauth},"
                "{negative_score_topauth},{godwins_score_topauth}\n")

    final_handle.write(template.format(
        subreddit=subreddit, num_comments=num_comments, num_words=num_words,
        num_chars=text_lengths, avg_word_length=avg_word_length,
        avg_words_per_comment=avg_words_per_comment,
        positive_score=positive_score, negative_score=negative_score,
        godwins_score=godwins_score,
        num_comments_topcom=num_comments_topcom, num_words_topcom=num_words_topcom,
        num_chars_topcom=text_lengths_topcom, avg_word_length_topcom=avg_word_length_topcom,
        avg_words_per_comment_topcom=avg_words_per_comment_topcom,
        positive_score_topcom=positive_score_topcom, negative_score_topcom=negative_score_topcom,
        godwins_score_topcom=godwins_score_topcom,
        num_comments_botcom=num_comments_botcom, num_words_botcom=num_words_botcom,
        num_chars_botcom=text_lengths_botcom, avg_word_length_botcom=avg_word_length_botcom,
        avg_words_per_comment_botcom=avg_words_per_comment_botcom,
        positive_score_botcom=positive_score_botcom, negative_score_botcom=negative_score_botcom,
        godwins_score_botcom=godwins_score_botcom,
        num_comments_topauth=num_comments_topauth, num_words_topauth=num_words_topauth,
        num_chars_topauth=text_lengths_topauth, avg_word_length_topauth=avg_word_length_topauth,
        avg_words_per_comment_topauth=avg_words_per_comment_topauth,
        positive_score_topauth=positive_score_topauth, negative_score_topauth=negative_score_topauth,
        godwins_score_topauth=godwins_score_topauth
    ))
    final_handle.flush()

    template = '{subreddit},{weekday},{hour},{count},{count_topcom},{count_botcom},{count_topauth}\n'
    for weekday in range(7):
        for hour in range(24):
            time_handle.write(template.format(
                subreddit=subreddit, weekday=weekday,
                hour=hour, count=time_buckets[(weekday, hour)],
                count_topcom=time_buckets_topcom[(weekday, hour)],
                count_botcom=time_buckets_botcom[(weekday, hour)],
                count_topauth=time_buckets_topauth[(weekday, hour)]
            ))
    time_handle.flush()

    print("""
    Number of comments: {}
    Number of words: {}
    Number of characters: {}
    Average word length: {}
    Average words per comment: {}
    Top Positive Words: {}
    Positive Score: {}
    Top Negative Words: {}
    Negative Score: {}
    Top Godwins Words: {}
    Godwins Score: {}
    Time Buckets: {}
    """.format(
        overall_stats[2], overall_stats[0], overall_stats[1],
        avg_word_length, avg_words_per_comment, positive_counts[:25],
        positive_score , negative_counts[:25], negative_score,
        godwins_law_counts[:25], godwins_score, time_buckets
    ))


"""
Initiate and aggregates the child processes
"""
def multiprocess(comment_list, NUM_POOLS, overall_stats):
    process_start_time = time()

    print('Reached {} comments. Firing off comment analysis processes'.format(len(comment_list)))

    comment_chunks = list(chunks(comment_list, len(comment_list) / NUM_POOLS))
    pool = Pool(NUM_POOLS)

    # The map function takes in an iterable and sends
    # the chunks into separate processes
    results = pool.map(compute_comments, comment_chunks)

    # Wait for it to be done
    pool.close()
    pool.join()

    process_end_time = time()

    pool_results = aggregate_results(results)
    overall_stats = [merge_two_count_dicts(x, y) if type(x) == dict else x + y for x, y in zip(pool_results, overall_stats)]
    return overall_stats


"""
Check the top occurring subreddits in the first comment_limit comments
Test
"""
def top_occurring():
    
    path = os.path.join('data', MONTH_FILE, MONTH_FILE)
    data_file = open(path, 'r')
    subreddits = dict()
    counter = 0
    t0 = time()

    for line in data_file:
        counter += 1
        if (counter % 100000 == 0):
            print("At {} comments".format(counter))
        line = line.rstrip()
        comment = json.loads(line)
        subreddit = comment['subreddit']
        if subreddit in subreddits:
            subreddits[subreddit] += 1
        else:
            subreddits[subreddit] = 1

    output_file = open(os.path.join(RESULTS_PATH, 'subreddit_counts_{}.txt'.format(MONTH_FILE)), 'w')
    sorted_subreddits = sorted(subreddits.items(), reverse=True, key=operator.itemgetter(1))
    for entry in sorted_subreddits:
        output_file.write('{subreddit}: {count}\n'.format(subreddit=entry[0], count=entry[1]))

    output_file.write('Number of subreddits found in {counter} comments: {num_subreddits}'.format(counter=counter, num_subreddits=len(sorted_subreddits)))  
    output_file.write('Took {} seconds to process the comments'.format(time() - t0))

"""
Create word clouds for the list of subreddits
"""
def word_clouds():

    # Word cloud probably doesn't change much after
    # enough comments
    subreddit_comment_limit = 1000000

    cloud_path = os.path.join('wordclouds', MONTH_FILE)
    path = os.path.join('data', MONTH_FILE, 'by_subreddit')

    found_subreddit = False

    for subreddit in SUBREDDITS:

        start_time = time()
        comment_counter = 0  # Count total comments

        word_counts = dict()

        data_file_name = os.path.join(path, subreddit[0].lower() + '.sorted')
        data_file = open(data_file_name, 'r')

        print("Looking for r/{} comments in file {}".format(subreddit, data_file_name))

        found_subreddit = False

        #Parse the lines with the comment data
        for comment_line in data_file:
            comment_line = comment_line.rstrip()
            comment_json = json.loads(comment_line)
            if comment_json['subreddit'] == subreddit:
                if not found_subreddit:
                    print("Found r/{} comments".format(subreddit))
                found_subreddit = True

                comment_counter += 1
                if comment_counter % 50000 == 0:
                    print("At comment {}".format(comment_counter))

                if comment_counter > subreddit_comment_limit:
                    break

                text = comment_json['body']
                words = text.split()
                for word in words:
                    if word in word_counts:
                        word_counts[word] += 1
                    else:
                        word_counts[word] = 1

            else:
                if found_subreddit == True:
                    break

        end_time = time()
        print('Took {} seconds to gather word counts for {} unique words in {} comments for r/{}'.format(end_time - start_time, len(word_counts), comment_counter, subreddit))

        print('Generating word cloud')
        stopwords = {'will', 'one'}
        words_string = ' '.join(word_counts.keys())
        filtered_words = [pair[0] for pair in WordCloud().process_text(words_string)]
        filtered_word_counts = {filtered_word: word_counts[filtered_word] for filtered_word in filtered_words if filtered_word in word_counts and filtered_word not in stopwords}
        wordcloud = WordCloud(width=1000, height=500, stopwords=stopwords).generate_from_frequencies(filtered_word_counts.items())
        file_path = os.path.join(cloud_path, '{}_wordcloud.png'.format(subreddit))
        wordcloud.to_file(file_path)
        print('Saved word cloud to {}'.format(file_path))

"""
Create word clouds for the list of subreddits
"""
def comment_author_percentiles():

    # For comments
    UPPER_PERCENTILE = .95
    LOWER_PERCENTILE = .05

    # Top author percentile (by comment volume)
    AUTHOR_PERCENTILE = .05

    comment_percentiles = dict()
    author_percentiles = dict()

    path = os.path.join('data', MONTH_FILE, 'by_subreddit')
    found_subreddit = False

    for subreddit in reversed(SUBREDDITS):

        start_time = time()
        comment_counter = 0  # Count total comments

        score_counts = dict()
        author_counts = dict()

        data_file_name = os.path.join(path, subreddit[0].lower() + '.sorted')
        data_file = open(data_file_name, 'r')

        print("Looking for r/{} comments in file {}".format(subreddit, data_file_name))

        found_subreddit = False

        #Parse the lines with the comment data
        for comment_line in data_file:
            comment_line = comment_line.rstrip()
            comment_json = json.loads(comment_line)
            if comment_json['subreddit'] == subreddit:
                if not found_subreddit:
                    print("Found r/{} comments".format(subreddit))
                found_subreddit = True

                comment_counter += 1
                if comment_counter % 50000 == 0:
                    print("At comment {}".format(comment_counter))

                score = int(comment_json['score'])
                if score in score_counts:
                    score_counts[score] += 1
                else:
                    score_counts[score] = 1

                author = comment_json['author']
                if author in author_counts:
                    author_counts[author] += 1
                else:
                    author_counts[author] = 1
            else:
                if found_subreddit == True:
                    break

        end_time = time()
        
        print('Took {} seconds to gather score/author counts for {} unique scores in {} comments for r/{}'.format(end_time - start_time, len(score_counts), comment_counter, subreddit))

        print('Generating comment percentiles')
        score_counts = sorted(score_counts.items(), reverse=False, key=operator.itemgetter(0))
        print(score_counts)
        upper = int(comment_counter * UPPER_PERCENTILE)
        lower = int(comment_counter * LOWER_PERCENTILE)
        cur_count = 0
        upper_percentile_score = 0
        for score, count in score_counts:
            cur_count += count
            if cur_count > upper:
                upper_percentile_score = score
                break

        cur_count = 0
        lower_percentile_score = 0
        for score, count in score_counts:
            cur_count += count
            if cur_count > lower:
                lower_percentile_score = score
                break
            
        comment_percentiles[subreddit] = str(lower_percentile_score) + ',' + str(upper_percentile_score)
        print(str(lower_percentile_score) + ',' + str(upper_percentile_score))
    
        print('Generating author percentiles')
        num_unique_authors = len(author_counts)
        author_counts = [item for item in author_counts.items() if item[1] > 10]
        author_counts.sort(reverse=True, key=operator.itemgetter(1))
        
        upper = int(num_unique_authors * AUTHOR_PERCENTILE)
        top_authors = author_counts[:upper]
        print(top_authors[:10])
        print(len(top_authors))

        author_percentiles[subreddit] = set([pair[0] for pair in top_authors])
        print('subreddit {}: {}'.format(subreddit, int(upper)))

    with open(os.path.join(LOOKUP_PATH, 'top_authors_{}.p'.format(MONTH_FILE)), 'wb') as output:
        pickle.dump(author_percentiles, output)
    with open(os.path.join(LOOKUP_PATH, 'comment_percentiles_{}.json'.format(MONTH_FILE)), 'w') as output:
        json.dump(comment_percentiles, output)

"""
Sort and dedupe dictionaries so if you add more words manually
it's still easy to read
"""
def sort_sentiment_dicts():
    file_names = {'sentiment/positive_emotions.txt', 'sentiment/negative_emotions.txt'}
    for file_name in file_names:
        file = open(file_name, 'r')
        words = ast.literal_eval(file.read())
        words = list(set(words))
        words.sort()
        file.close()
        file = open(file_name, 'w')
        file.write(repr(words))


if __name__ == "__main__":
    for month_file in MONTH_FILES[1:]:
        MONTH_FILE = month_file
        #comment_author_percentiles()
        #top_occurring()
        #word_clouds()
        process_comments()

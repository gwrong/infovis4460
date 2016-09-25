import ast
import json
import os
from multiprocessing import Pool
import operator
from string import ascii_lowercase
import sys
from time import time
from wordcloud import WordCloud


# TODO: Create a proper subset ofs data for easier testing
# TODO: Organize comments into smaller data files for easier individual subreddit analysis
# TODO: Integrate word clouds into the main analysis

# Sentiment analysis words
positive_emotion_words = set()
negative_emotion_words = set()
godwins_law_words = set()

DATA_FILE_NAME = 'data/RC_2016-08'
#DATA_FILE_NAME = 'data/RC_2016-08.small'

# Number of processes to spawn for comment computation
NUM_POOLS = 2

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

    #print("Subprocess analyzing {} comments".format(len(comments)))
    positive_emotions_total = dict.fromkeys(positive_emotion_words, 0)
    negative_emotions_total = dict.fromkeys(negative_emotion_words, 0)
    godwins_law_total = dict.fromkeys(godwins_law_words, 0)
    counter = 0

    word_count = 0
    text_length = 0
    for comment in comments:
        if counter % 10000 == 0:
            print("At comment {} for some multiprocess".format(counter))
            sys.stdout.flush()
        counter += 1
        text = comment['body']
        words = text.split()

        word_count += len(words)
        text_length += len(text)
        compute_positive_emotions(text, positive_emotions_total)
        compute_negative_emotions(text, negative_emotions_total)
        compute_godwin(text, godwins_law_total)
    return [word_count, text_length, len(comments), positive_emotions_total, negative_emotions_total, godwins_law_total]


"""
Master analysis function. Calculates stats for all subreddits
"""
def process_comments():
    # One comment JSON per line. File format:
    # {"gilded":0,"author_flair_text":"Male","author_flair_css_class":"male","retrieved_on":1425124228,"ups":3,"subreddit_id":"t5_2s30g","edited":false,"controversiality":0,"parent_id":"t1_cnapn0k","subreddit":"AskMen","body":"I can't agree with passing the blame, but I'm glad to hear it's at least helping you with the anxiety. I went the other direction and started taking responsibility for everything. I had to realize that people make mistakes including myself and it's gonna be alright. I don't have to be shackled to my mistakes and I don't have to be afraid of making them. ","created_utc":"1420070668","downs":0,"score":3,"author":"TheDukeofEtown","archived":false,"distinguished":null,"id":"cnasd6x","score_hidden":false,"name":"t1_cnasd6x","link_id":"t3_2qyhmp"}

    # Data file is 32GB
    # 69,654,819 comments
    
    path = 'data/by_subreddit/'

    sort_sentiment_dicts()
    final_csv_file = open("reddit_august_2016.csv", 'w')
    final_csv_file.write('subreddit,num_comments,num_words,num_chars,avg_word_length,avg_words_per_comment,positive_score,negative_score,godwins_score\n')

    for subreddit in reversed(SUBREDDITS):

        start_time = time()
        comment_counter = 0  # Count total comments

        overall_stats = [0] * 3 + [{}] * 3  # Must match the features array in type and length
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
        #return overall_stats

        #overall_stats = multiprocess(comment_list, NUM_POOLS, overall_stats)

        end_time = time()
        print('Took {} seconds to process {} comments for r/{}'.format(end_time - start_time, comment_counter, subreddit))

        final_formatter(subreddit, overall_stats, final_csv_file)

    final_csv_file.close()
        

"""
Takes the final output per subreddit and writes the
data to the given file handle
"""
def final_formatter(subreddit, overall_stats, file_handle):
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

    positive_score = 1000 * positive_sum / float(num_words)
    negative_score = 1000 * negative_sum / float(num_words)
    godwins_score = 10000000 * godwins_law_sum / float(num_words)

    file_handle.write('{subreddit},{num_comments},{num_words},{num_chars},{avg_word_length},{avg_words_per_comment},{positive_score},{negative_score},{godwins_score}\n'.format(
        subreddit=subreddit, num_comments=num_comments, num_words=num_words,
        num_chars=text_lengths, avg_word_length=avg_word_length,
        avg_words_per_comment=avg_words_per_comment,
        positive_score=positive_score, negative_score=negative_score,
        godwins_score=godwins_score
    ))
    file_handle.flush()

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
    """.format(
        overall_stats[2], overall_stats[0], overall_stats[1],
        avg_word_length, avg_words_per_comment, positive_counts[:25],
        positive_score , negative_counts[:25], negative_score,
        godwins_law_counts[:25], godwins_score
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
    
    data_file = open(DATA_FILE_NAME, 'r')
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

    sorted_subreddits = sorted(subreddits.items(), reverse=True, key=operator.itemgetter(1))
    for entry in sorted_subreddits:
        print('{subreddit}: {count}'.format(subreddit=entry[0], count=entry[1]))

    print('Number of subreddits found in {counter} comments: {num_subreddits}'.format(counter=counter, num_subreddits=len(sorted_subreddits)))  
    print('Took {} seconds to process the comments'.format(time() - t0))

"""
Create word clouds for the list of subreddits
"""
def word_clouds():

    # Word cloud probably doesn't change much after
    # enough comments
    subreddit_comment_limit = 1000000

    cloud_path = 'wordclouds/'
    path = 'data/by_subreddit/'

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
    #top_occurring()
    #word_clouds()
    process_comments()
    #initialize_data_sets()

import json
import os
from string import ascii_lowercase

DATA_FILE_NAME = 'RC_2016-03'
DATA_FILE_PATH = os.path.join('data', DATA_FILE_NAME)
OUTPUT_PATH = os.path.join(DATA_FILE_PATH, 'by_subreddit')

"""
Convert the large data file into a bunch of smaller files partitioned
by letter the subreddit starts with. This makes subreddit lookup
much more efficient
Takes maybe 30min
"""
def partition_subreddits():

    data_file = open(os.path.join(DATA_FILE_PATH, DATA_FILE_NAME), 'r')
    chunk_size = 1000000
    counter = 0
    total_counter = 0
    comments = []

    for line in data_file:
        counter += 1
        total_counter += 1
        line = line.rstrip()
        comment = json.loads(line)
        comments.append(comment)

        if (counter > chunk_size):
            write_to_files(comments)
            print('Processed chunk of {}/{} comments'.format(counter, total_counter))
            counter = 0
            comments = []
        elif (counter % 50000 == 0):
            print('Processed {} comments...'.format(counter))


    if (counter > 0):
        write_to_files(comments)
        print('Processed chunk of {}/{} comments'.format(counter, total_counter))


"""
Helper to write comments to files by alphabetical order
of subreddit
"""
def write_to_files(comments):
    alphabet = '0123456789' + ascii_lowercase
    comments.sort(key=lambda x: x['subreddit'].lower())
    letter_index = 0
    letter_file = open(os.path.join(OUTPUT_PATH, alphabet[letter_index]), 'a')
    for comment in comments:
        #print(comment['subreddit'])
        #print(letter_index)
        if (comment['subreddit'][0].lower() != alphabet[letter_index]):
            while (comment['subreddit'][0].lower() != alphabet[letter_index]):
                letter_index += 1
            letter_file.close()
            letter_file = open(os.path.join(OUTPUT_PATH, alphabet[letter_index]), 'a')
        letter_file.write(json.dumps(comment) + '\n')
    letter_file.close()


"""
Sort the resulting files to make our lives easier later
"""
def sort_files():
    file_names = [file for file in os.listdir(OUTPUT_PATH) if os.path.isfile(os.path.join(OUTPUT_PATH, file))]
    
    for file_name in file_names:
        print("Starting {}".format(file_name))
        comments = []
        counter = 0
        file = open(os.path.join(OUTPUT_PATH, file_name), 'r')
        for line in file:
            counter += 1
            line = line.rstrip()
            comments.append(json.loads(line))
            if (counter % 50000 == 0):
                print(str(counter) + ' for ' + str(file_name))
        file.close()
        sorted_file = open(os.path.join(OUTPUT_PATH, file_name + '.sorted'), 'w')
        print('Sorting')
        comments.sort(key=lambda x: x['subreddit'])
        print('Sorted')
        for index in range(len(comments)):
            comments[index] = json.dumps(comments[index])
        print('Jsonified')
        for comment in comments:
            sorted_file.write(comment + '\n')
        print("Finished {}".format(file_name))
        sorted_file.close()


if __name__ == "__main__":
   print(OUTPUT_PATH)
   print(DATA_FILE_NAME)
   print(DATA_FILE_PATH)
   partition_subreddits()
   sort_files()
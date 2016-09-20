import operator
import json

# One comment JSON per line. File format:
# {"gilded":0,"author_flair_text":"Male","author_flair_css_class":"male","retrieved_on":1425124228,"ups":3,"subreddit_id":"t5_2s30g","edited":false,"controversiality":0,"parent_id":"t1_cnapn0k","subreddit":"AskMen","body":"I can't agree with passing the blame, but I'm glad to hear it's at least helping you with the anxiety. I went the other direction and started taking responsibility for everything. I had to realize that people make mistakes including myself and it's gonna be alright. I don't have to be shackled to my mistakes and I don't have to be afraid of making them. ","created_utc":"1420070668","downs":0,"score":3,"author":"TheDukeofEtown","archived":false,"distinguished":null,"id":"cnasd6x","score_hidden":false,"name":"t1_cnasd6x","link_id":"t3_2qyhmp"}

# Data file is 32GB
# 69,654,819 comments
data_file_name = 'RC_2016-08'
data_file = open(data_file_name, 'r')

# Check the top occurring subreddits in the first comment_limit comments
comment_limit = 1000000
subreddits = dict()
counter = 0

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

# TODO: Create a subset of the data for quicker testing
# TODO: Implement multiprocessing to speed up analysis (if necessary)
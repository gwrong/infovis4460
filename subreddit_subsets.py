"""
This file lists all the subreddits we are interested in.
100% of this code was written by our team.
"""

top_25_comment_subreddits = [
    'relationships',
    'gifs',
    'nba',
    'GlobalOffensive',
    'wow',
    'nfl',
    'todayilearned',
    'gaming',
    'pcmasterrace',
    'soccer',
    'pics',
    'movies',
    'videos',
    'DotA2',
    'funny',
    'news',
    'SquaredCircle',
    'worldnews',
    'leagueoflegends',
    'The_Donald',
    'Overwatch',
    'pokemongo',
    'NoMansSkyTheGame',
    'politics',
    'AskReddit',
]

top_25_subscriber_subreddits = [
    'AskReddit',
    'funny',
    'todayilearned',
    'pics',
    'science',
    'worldnews',
    'IAmA',
    'announcements',
    'videos',
    'gaming',
    'movies',
    'blog',
    'Music',
    'aww',
    'news',
    'gifs',
    'explainlikeimfive',
    'askscience',
    'EarthPorn',
    'books',
    'television',
    'LifeProTips',
    'mildlyinteresting',
    'DIY',
    'Showerthoughts',
]

political_subreddits = [
    'politics',
    'The_Donald',
    'Libertarian',
    'Anarchism',
    'socialism',
    'progressive',
    'Conservative',
    'democrats',
    'Republican',
    'hillaryclinton',
    'PoliticalHumor',
    'HillaryForPrison',
]

university_subreddits = [
    'rit',
    'ucla',
    'berkeley',
    'UIUC',
    'VirginiaTech',
    'RPI',
    'rutgers',
    'aggies',
    'gatech',
    'UCSantaBarbara',
    'msu',
    'uofm',
    'UCSD',
    'UVA',
    'uofmn',
]

sports_subreddits = [
    'nba',
    'soccer',
    'hockey',
    'nfl',
    'NASCAR',
    'formula1',
    'baseball',
    'tennis',
    'golf',
    'MMA',
    'Archery',
    'Boxing',
    'lacrosse',
    'Cricket',
    'SquaredCircle',
    'fantasyfootball',
    'olympics',
    'tabletennis',
    'Bowling',
    'volleyball',
    'theocho',
]

science_technology_history_subreddits = [
    'science',
    'askscience',
    'space',
    'Astronomy',
    'gadgets',
    'Futurology',
    'technology',
    'Android',
    'iphone',
    'history',
    'AskHistorians',
    'engineering',
    'wikipedia',
    'EverythingScience',
    'geek',
    'tech',
    'HistoryPorn',
    'badhistory',
]

top_25_nsfw_subscriber_subreddits = [
    'gonewild',
    'nsfw',
    'ImGoingToHellForThis',
    'RealGirls',
    'NSFW_GIF',
    'FiftyFifty',
    'holdthemoan',
    'nsfw_gifs',
    'BustyPetite',
    'Amateur',
    'cumsluts',
    'ass',
    'Boobies',
    'milf',
    'GirlsFinishingTheJob',
    'MorbidReality',
    'OnOff',
    'LegalTeens',
    'rule34',
    '60fpsporn',
    'girlsinyogapants',
    'PetiteGoneWild',
    'gonewildcurvy',
    'WatchItForThePlot',
    'dirtysmall',
]

misc_subreddits = [
    'meirl',
    'nosleep',
    'woahdude',
    'DeepIntoYouTube',
    'SubredditSimulator',
    'depression',
    'cringe',
    'Showerthoughts',
    'travel',
    '4chan',
    'UpliftingNews',
    'creepy',
    'Jokes',
    'cringepics',
    'tifu',
    'WTF',
    'creepyPMs',
    'rage',
    'guns',
    'conspiracy',
]

def get_all_subreddits():
    subreddits = list(
        set(
            top_25_subscriber_subreddits + top_25_comment_subreddits +
            political_subreddits +
            university_subreddits + sports_subreddits +
            science_technology_history_subreddits +
            misc_subreddits + top_25_nsfw_subscriber_subreddits
        )
    )
    
    print("Gathering stats for {} unique subreddits".format(len(subreddits)))
    return subreddits

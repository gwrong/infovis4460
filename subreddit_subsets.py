top_subreddits = [
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
    'wikipedia',
]

def get_all_subreddits():
    subreddits = list(
        set(
            top_subreddits + political_subreddits +
            university_subreddits + sports_subreddits +
            science_technology_history_subreddits +
            misc_subreddits
        )
    )
    print("Gathering stats for {} unique subreddits".format(len(subreddits)))
    return subreddits

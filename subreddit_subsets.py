top_subreddits = [
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
]

political_subreddits = [
    'politics',
    'The_Donald',
    'Libertarian',
    'Anarchism',
    'socialism',
    'progressive'
    'Conservative',
    'democrats',
    'Republican',
    'hillaryclinton',
]

university_subreddits = [
    'rit',
    'ucla',
    'berkeley',
    'uiuc',
    'virginiatech',
    'rpi',
    'rutgers',
    'aggies',
    'gatech',
    'ucsantabarbara',
    'msu',
    'uofm',
    'ucsd',
    'uva',
    'uofmn',
    'ucf',
    'uoft',
    'fsu',
    'calpoly',
]

sports_subreddits = [
    'sports',
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
    'chess',
    'poker',
    'fantasyfootball',
    'olympics',
    'billiards',
    'tabletennis',
    'Fencing',
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
    'buildapc',
    'history',
    'AskHistorians',
    'Physics',
    'engineering',
    'wikipedia',
]

misc_subreddits = [
    'meirl',
    'nosleep',
    'woahdude',
    'DeepIntoYouTube',
    'SubredditSimulator',
    'depression',
    'cringe',
    'ShowerThoughts',
    'travel'
]

def get_all_subreddits():
    return list(
        set(
            top_subreddits + political_subreddits +
            university_subreddits + sports_subreddits +
            science_technology_history_subreddits +
            misc_subreddits
        )
    )


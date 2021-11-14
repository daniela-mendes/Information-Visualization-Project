import pandas as pd

friends = pd.read_excel("friends_db.xlsx")
technical = pd.read_excel("technical-boxplot-fav.xlsx")

main_characters = ['Monica Geller', 'Ross Geller', 'Rachel Green', 'Joey Tribbiani', 'Chandler Bing', 'Phoebe Buffay']
presence = {}

idx = 0

seasons = friends.groupby('season')
for season in seasons:
	episodes = season[1].groupby('episode')
	for episode in episodes:
		presence.clear()
		for index, row in episode[1].iterrows():
			if row['characters'] in main_characters:
				line = len(row['line'].split(' '))
				if row['characters'] in presence.keys():
					presence[row['characters']] += line
				else:
					presence[row['characters']] = line
		char = (max(zip(presence.values(), presence.keys()))[1]).split(' ')[0]
		technical.loc[idx, 'Character'] = char
		
		if char == 'Monica':
			c = '#be0a09'
		elif char == 'Joey':
			c = '#76a47d'
		elif char == 'Chandler':
			c = '#d8873a'
		elif char == 'Phoebe':
			c = '#9d616e'
		elif char == 'Ross':
			c = '#85a2be'
		elif char == 'Rachel':
			c = '#eab913'

		technical.loc[idx, 'Colour'] = c
		idx += 1


technical.to_excel("technical-boxplot-fav.xlsx", index=False, encoding="latin1")
technical.to_csv("technical-boxplot-fav.csv", index=False, encoding="latin1")


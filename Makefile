all: pronounce_iamb_compat.js

pronounce_iamb_compat.js: convert_cmudict.py cmudict.0.7a common_words.txt capitalize addme deleteme
	python convert_cmudict.py >pronounce_iamb_compat.js

common_words.txt:
	touch common_words.txt

capitalize:
	touch capitalize

addme:
	touch addme

deleteme:
	touch deleteme

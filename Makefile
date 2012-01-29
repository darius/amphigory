all: pronounce_iamb_compat.js

pronounce_iamb_compat.js: convert_cmudict.py ../languagetoys/cmudict.0.7a common_words.txt capitalize deleteme
	python convert_cmudict.py >pronounce_iamb_compat.js

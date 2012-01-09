all: cmudict.js

cmudict.js: convert_cmudict.py ../languagetoys/cmudict.0.7a
	python convert_cmudict.py >cmudict.js

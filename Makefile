all: cmudict.js.gz

cmudict.js.gz: cmudict.js
	gzip cmudict.js

cmudict.js: convert_cmudict.py ../languagetoys/cmudict.0.7a
	python convert_cmudict.py >cmudict.js

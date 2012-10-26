A web toy generating rhymed metrical verse using the CMU pronouncing
dictionary. Derived from https://github.com/darius/languagetoys/blob/master/simpleverse.py
(but fancier now).

Thanks to Shae Erisson, Flourish Klink, and Halsted Bernard for beta
feedback.

To run this locally: point your browser at index.html.

To rebuild the dictionary, you need some files not in the repo, and
not handy to me (I'm on an extended trip). If you had them, you'd then:

  * Fetch cmudict.0.7a into this directory, from
    http://www.speech.cs.cmu.edu/cgi-bin/cmudict
    or specifically: `wget https://cmusphinx.svn.sourceforge.net/svnroot/cmusphinx/trunk/cmudict/cmudict.0.7a`.

  * Run `make`. This filters and compresses the dictionary for the
    Javascript code's use. (For a more human vocabulary, quicker start,
    and lower bandwidth bills.)

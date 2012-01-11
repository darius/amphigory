"""
Convert the CMU pronouncing dictionary to a JSON object.
First filter out less-useful entries, then compress it 
exploiting the sorted order.
"""

import string

# common_words.txt is in descending order of frequency;
# let's take the first 50000.
common_words = set(line.split()[0]
                   for i, line in zip(xrange(50000), open('common_words.txt')))

good_starts = "'" + string.ascii_uppercase

def potentially_iambic(phones):
    beats = [phone for phone in phones if phone[-1] in '012']
    stress_parities = [i % 2 for i, phone in enumerate(beats)
                       if phone[-1] in '12']
    # A word can take part in iambic meter when it stresses only
    # odd-numbered or only even-numbered syllables, but not both:
    return len(stress_parities) < 2

pronunciations = {}
for line in open('../languagetoys/cmudict.0.7a'):
    if ';;' in line or not line.strip(): continue
    word, phones = line.split(None, 1)
    if word[0] not in good_starts: continue
    if word.endswith(')'): continue # Ignore alternative pronunciations, for now
    if word.lower() not in common_words: continue
    if not potentially_iambic(phones.split()): continue
    pronunciations[word.lower()] = tuple(phones.split())

# Compressed encoding: strip out prefix in common with the previous
# entry, replace it with its length.

def append(xs, prev, x):
    if not xs:
        xs.append(x)
    else:
        xs.append(prefix_encode(prev, x))

def prefix_encode(prev, s):
    n = min(9, common_prefix_length(prev, s))
    return s if n < 2 else '%d%s' % (n, s[n:])

def common_prefix_length(s, t):
    n = 0
    for si, ti in zip(s, t):
        if si != ti: break
        n += 1
    return n

words, phones = [], []
wprev, pprev = None, None
for w, p in sorted(pronunciations.items()):
    p = '-'.join(p)
    append(words, wprev, w);  wprev = w
    append(phones, pprev, p); pprev = p

print 'var dictionary = {'
print 'words:"%s",' % ' '.join(words)
print 'phones:"%s"' % ' '.join(phones)
print '};'

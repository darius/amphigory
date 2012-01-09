"""
Convert the CMU pronouncing dictionary to a JSON object.
"""

import string

good_starts = "'" + string.ascii_uppercase

pronunciations = {}
for line in open('../languagetoys/cmudict.0.7a'):
    if ';;' in line or not line.strip(): continue
    word, phones = line.split(None, 1)
    if word[0] not in good_starts: continue
    if word.endswith(')'): continue # Ignore alternative pronunciations, for now
    pronunciations[word.lower()] = tuple(phones.split())

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

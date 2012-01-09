// load('cmudict.js');

function decodeSequence(s) {
    var strings = s.split(' ');
    var prev = null;
    for (var i = 0; i < strings.length; ++i) {
        if (prev !== null)
            prev = strings[i] = decode(prev, strings[i]);
        else
            prev = s;
    }
    return strings;
}

function decode(prev, s) {
    var n = parseInt(s[0]);
    if (isNaN(n))
        return s;
    else
        return prev.substr(0, n) + s.substr(1);
}

var allWords = decodeSequence(dictionary.words);
var allPhones = decodeSequence(dictionary.phones);
(function() {
    for (var i = 0; i < allPhones.length; ++i)
        allPhones[i] = allPhones[i].split('-')
})();

var verseLength = 14;

//// versify()

var aNonrhyme = -2;
var anEcho = -1;
var aRhyme = 0;

// Return aNonrhyme, anEcho, or (aRhyme+strength).
// Assumes iambic meter (to supply implicit stresses).
// Assumes lengths > 0.
function checkRhyme(phones1, phones2) {
    var L1 = phones1.length;
    var L2 = phones2.length;
    var L = Math.min(L1, L2);
    var result = aNonrhyme;
    var stressed = true;
    for (var p = 1; ; ++p) { // Offset from right end of both phones arrays.
        var ph1 = phones1[L1-p];
        var ph2 = phones2[L2-p];
        if (sansStress(ph1) !== sansStress(ph2)) {
            if (stressed || 1 === p)
                return result;
            var n = p-1;
            if (phones1[L1-n] === 'Y' && 1 < n)
                --n;
            if (isVowel(phones1[L1-n]))
                return (aRhyme
                        + vowelStress(phones1[L1-n])
                        + vowelStress(phones2[L2-n]));
            else
                return result;
        }
        if (L === p)
            // A rhyme here is almost a can't-happen, so we won't
            // bother computing the rhyme's strength:
            return L1 === L2 ? anEcho : stressed ? aRhyme : aNonrhyme;
        if (isVowel(ph1)) {
            if (stressed) result = anEcho;
            stressed = !stressed;
        }
    }
}

function sansStress(phone) {
    return isVowel(phone) ? phone.substr(0, phone.length-1) : phone;
}

// Return the amount of stress carried by the vowel:
// 0,1,3 for none, middling, most.
function vowelStress(vowel) {
    var last = vowel[vowel.length-1];
    // The CMU dict has a funny way of denoting stress:
    // 0 for none, 2 for secondary stress, 1 for primary.
    if (last !== '0' && last !== '1' && last !== '2')
        throw "wtf" + vowel
    return last === '0' ? 0 : last === '2' ? 1 : 3;
}

/// allPhones[390]
//. AH0,B,Y,UW1,S
/// checkRhyme('M,AH0,B,Y,UW1,S'.split(','), allPhones[390])
//. -2
/// checkRhyme('M,AH0,B,Y,UW1,S'.split(','), 'Ou0,B,T,UW1,S'.split(','))
//. 6
/// checkRhyme(allPhones[390], allPhones[390])
//. -1

function isVowel(phone) {
    var last = phone[phone.length-1];
    return '0' <= last && last <= '2';
}

// Return a state given the *last* word, the last line's phones, and
// the *next* line/syllable numbers.
function makeVerseState(word, line, lineNum, syllableNum) {
    return {
        done: function() {
            return lineNum === verseLength && syllableNum === 0;
        },
        step: function() {
            var wp = randomWord();
            var w = wp[0], p = wp[1];
            var syllableAfter = checkMeter(syllableNum, p);
            if (syllableAfter === null || 10 < syllableAfter)
                return null;
            else if (syllableAfter < 10)
                return makeVerseState(w, line.concat(p), lineNum, syllableAfter);
            else {
                line = line.concat(p);
                if (!rhymesOK(lineNum, line))
                    return null;
                linePhones[lineNum] = line;
                return makeVerseState(w, [], lineNum+1, 0);
            }
        },
        emit: function() {
            var linebreak = syllableNum === 0 && 0 < lineNum && lineNum < verseLength;
            return word + (linebreak ? '<br>' : '');
        },
    };
};

// linePhones[i] is a list of the phones of line #i in the current state
// (for all completed lines in the current state).
var linePhones = [];

// Shakespearean-sonnet rhyme scheme
var rhymeLines = [[],[], [0],[1],[],[],[4],[5],[],[],[8],[9],[],    [12]];
var antiLines  = [[],[0],[], [], [],[4],[],[], [],[8],[],[],  [8,9],[]];

                        //  0    1   2   3  4  5  6
var rhymeAcceptability = [.01, .06, .4, .8, 1, 1, 1];

// Does line (a list of phones) rhyme appropriately? It should rhyme with all of
// rhymeLines[lineNum] and non-rhyme with all of antiLines[lineNum].
function rhymesOK(lineNum, line) {
    var i;
    for (i = 0; i < rhymeLines[lineNum].length; ++i) {
        var rhyme = checkRhyme(line, linePhones[rhymeLines[lineNum][i]]);
        if (rhyme < aRhyme || rhymeAcceptability[rhyme] <= Math.random())
            return false;
    }
    for (i = 0; i < antiLines[lineNum].length; ++i)
        if (aNonrhyme !== checkRhyme(line, linePhones[antiLines[lineNum][i]]))
            return false;
    return true;
}

function checkMeter(syllableNum, phones) {
    for (var i = 0; i < phones.length; ++i) {
        var ph = phones[i];
        var last = ph[ph.length-1];
        if ('0' <= last && last <= '2') {
            if (syllableNum % 2 == 0 && last !== '0')
                return null;
            ++syllableNum;
        }
    }
    return syllableNum;
}

var startVersify = makeVerseState('', [], 0, 0);

/// allWords[390]
//. abuse
/// checkMeter(0, allPhones[390])
//. 2
/// makeVerseState(allWords[390], allPhones[390], 0, 2).emit()
//. abuse

var states = [];

function versify(takeVerse) {
    var intervalId = setInterval(keepScribbling, 0);
    var persistence = 200000;
    var backtrackProbability = 0.1;

    var nfail = 0;
    states = [startVersify];

    function keepScribbling() {
        // When fuel runs out, yield this timeslice.
        for (var fuel = 1000; 0 < fuel; --fuel) {
            var state = states[states.length-1].step();
            if (state !== null) {
                states.push(state);
                if (state.done()) {
                    clearInterval(intervalId);
                    takeVerse(emit(states));
                    return;
                }
            } else {
                ++nfail;
                if (persistence <= nfail) {
                    // Restart
                    nfail = 0;
                    states = [startVersify];  
                    continue;
                }
                for (; 1 < states.length; states.pop())
                    if (backtrackProbability <= Math.random())
                        break;
            }
        }
    }
}

function emit(states) {
    var parts = [];
    for (var i = 0; i < states.length; ++i)
        parts.push(states[i].emit());
    return parts.join(' ');
}

function randomWord() {
    var n = Math.floor(Math.random() * allWords.length);
    return [allWords[n], allPhones[n]];
}


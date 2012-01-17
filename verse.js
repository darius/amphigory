// The pronouncing dictionary, encoded in dictionary.words and
// dictionary phones. We need to decompress it before we can use it.
// The result is two parallel arrays, of words and corresponding phone
// sequences. A phone denotes a basic speech sound.

// load('pronounce_iamb_compat.js');

// Decompress a string compressed by convert_cmudict.py, producing an array.
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

// Expand a string s using the common prefix from the previous string.
function decode(prev, s) {
    var n = parseInt(s[0]);
    if (isNaN(n))
        return s;
    else
        return prev.substr(0, n) + s.substr(1);
}

var allWords  = decodeSequence(dictionary.words);
var allPhones = decodeSequence(dictionary.phones);
(function() {
    for (var i = 0; i < allPhones.length; ++i)
        allPhones[i] = [' '].concat(allPhones[i].split('-'));
})();

// Pick a word along with its pronunciation.
function randomWord() {
    var n = Math.floor(Math.random() * allWords.length);
    return [allWords[n], allPhones[n]];
}


// Taking phones to appear in a line of iambic meter after syllableNum
// syllables, does the line scan? If so, return the next syllable
// number following; else null.
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


// Do two phone-sequences rhyme? And if so, how well?

var aNonrhyme = -2;   // No, not at all.
var anEcho = -1;      // No, they echo, e.g. the same word both times.
var aRhyme = 0;       // Yes.

// Return aNonrhyme, anEcho, or (aRhyme+strength where 0 <= strength <= 6).
// Assumes iambic meter (to supply implicit stresses).
// Assumes lengths > 0.
function checkRhyme(phones1, endStressed1, phones2, endStressed2) {
    if (endStressed1 !== endStressed2)
        return aNonrhyme;
    var L1 = phones1.length;
    var L2 = phones2.length;
    var L = Math.min(L1, L2);
    var result = aNonrhyme;
    var stressed = !endStressed1;
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

// Is phone a vowel?
function isVowel(phone) {
    var last = phone[phone.length-1];
    return '0' <= last && last <= '2';
}

// Return the amount of stress carried by the vowel:
// 0,1,3 for none, middling, most.
function vowelStress(vowel) {
    var last = vowel[vowel.length-1];
    // The CMU dict has a funny way of denoting stress:
    // 0 for none, 2 for secondary stress, 1 for primary.
    return last === '0' ? 0 : last === '2' ? 1 : 3;
}

 // Return phone minus any vowel-stress designation it might carry.
function sansStress(phone) {
    return isVowel(phone) ? phone.substr(0, phone.length-1) : phone;
}

/// allPhones[1]
//.  ,T,R,IH2,P,AH0,L,EY1
/// checkRhyme('M,AH0,B,Y,UW1,S'.split(','), false, allPhones[390], false)
//. -2
/// checkRhyme('M,AH0,B,Y,UW1,S'.split(','), false, 'OU0,B,T,UW1,S'.split(','), false)
//. 6
/// checkRhyme(allPhones[390], true, allPhones[390], true)
//. -1
/// checkRhyme('M, ,AH1,B,Y,UW0,S'.split(','), true, 'W, ,AH1,B,Y,UW0,S'.split(','), true)
//. -1
/// checkRhyme('M,AH1,B,Y,UW0,S'.split(','), true, 'W, ,AH1,B,Y,UW0,S'.split(','), true)
//. 6


// Statefully composing a whole random verse.

// Shakespearean-sonnet rhyme scheme. Read this as a column for each
// line number. E.g. line 0 is unconstrained; but line 1 must not
// rhyme with line 0, and line 2 OTOH must rhyme with line 0.
var rhymeLines = [[],[], [0],[1],[],[],[4],[5],[],[],[8],[9],[],    [12]];
var antiLines  = [[],[0],[], [], [],[4],[],[], [],[8],[],[],  [8,9],[]];

var verseLength = rhymeLines.length;

// linePhones[i] is a list of the phones of line #i in the current state
// (for all completed lines in the current state).
var linePhones = [];

// lineLengths[i] is the length in syllables of line #i in the current state.
var lineLengths = [];

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
            if (syllableAfter === null || 11 < syllableAfter)
                return null;
            else if (syllableAfter < 10)
                return makeVerseState(w, line.concat(p), lineNum, syllableAfter);
            else {
                line = line.concat(p);
                if (!rhymesOK(lineNum, line, syllableAfter))
                    return null;
                linePhones[lineNum] = line;
                lineLengths[lineNum] = syllableAfter;
                return makeVerseState(w, [], lineNum+1, 0);
            }
        },
        emit: function() {
            var linebreak = syllableNum === 0 && 0 < lineNum && lineNum < verseLength;
            return word + (linebreak ? '<br>' : '');
        },
    };
};

var startVersify = makeVerseState('', [], 0, 0);

                        //  0    1   2   3  4  5  6
var rhymeAcceptability = [.01, .06, .4, .8, 1, 1, 1];

// Does line (a list of phones) rhyme appropriately? It should rhyme with all of
// rhymeLines[lineNum] and non-rhyme with all of antiLines[lineNum].
function rhymesOK(lineNum, line, nsyllables) {
    var i;
    for (i = 0; i < rhymeLines[lineNum].length; ++i) {
        var other = rhymeLines[lineNum][i];
        var rhyme = checkRhyme(line, nsyllables % 2,
                               linePhones[other], lineLengths[other] % 2);
        if (rhyme < aRhyme || rhymeAcceptability[rhyme] <= Math.random())
            return false;
    }
    for (i = 0; i < antiLines[lineNum].length; ++i) {
        var other = antiLines[lineNum][i];
        if (aNonrhyme !== checkRhyme(line, nsyllables % 2,
                                     linePhones[other], lineLengths[other] % 2))
            return false;
    }
    return true;
}

/// allWords[1]
//. aaa
/// checkMeter(1, allPhones[1])
//. 4
/// makeVerseState(allWords[1], allPhones[1], 0, 2).emit()
//. aaa


// Compose a verse by advancing and backtracking.

// All successive states of the versifying so far as it's gotten, kept
// for backtracking and to emit the words from once we succeed.
var states = [];

// Make a new random verse and call takeVerse(theVerseText) with it.
// Do the work in timeslices so we don't freeze the browser tab.
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

// Return the verse text as far as it's currently composed.
function emit(states) {
    var parts = [];
    for (var i = 0; i < states.length; ++i)
        parts.push(states[i].emit());
    return parts.join(' ');
}

function reverse_complement(seq, reverse = true, complement = true) {
    var complement_info = {
        'A': 'T',
        'T': 'A',
        'C': 'G',
        'G': 'C',
        'R': 'Y',
        'Y': 'R',
        'S': 'W',
        'W': 'S',
        'K': 'M',
        'M': 'K',
        'B': 'V',
        'D': 'H',
        'H': 'D',
        'V': 'B'
    };

    if (reverse && !complement) {
        var rev_seq = seq.split('').reverse().join('')
        return rev_seq

    } else if (!reverse && complement) {
        let com_seq = '';
        for (let i = 0; i < seq.length; i++) {
            com_seq += complement_info[seq[i]]
        }
        return com_seq
    } else {
        let com_seq = '';
        for (let i = 0; i < seq.length; i++) {
            com_seq += complement_info[seq[i]]
        }
        return com_seq.split('').reverse().join('')
    }
}

function find_grna(dna_string, pam, len_grna, reverse = false) {
    var grna_info = [];
    var pam_rev = reverse_complement(pam, true, false);
    var pam_re = '';
    var pam_re_rev = '';

    for (let i in pam) {
        if (pam[i] === 'N') {
            pam_re += '[ATCG]'
        } else if (pam[i] === 'R') {
            pam_re += '[AG]'
        } else if (pam[i] === 'W') {
            pam_re += '[AT]'
        } else if (pam[i] === 'M') {
            pam_re += '[AC]'
        } else if (pam[i] === 'Y') {
            pam_re += '[CT]'
        } else if (pam[i] === 'S') {
            pam_re += '[GC]'
        } else if (pam[i] === 'K') {
            pam_re += '[GT]'
        } else if (pam[i] === 'B') {
            pam_re += '[CGT]'
        } else if (pam[i] === 'D') {
            pam_re += '[AGT]'
        } else if (pam[i] === 'H') {
            pam_re += '[ACT]'
        } else if (pam[i] === 'V') {
            pam_re += '[ACG]'
        } else {
            pam_re += pam[i]
        }
    }
    for (let i in pam_rev) {
        if (pam_rev[i] === 'N') {
            pam_re_rev += '[ATCG]'
        } else if (pam_rev[i] === 'R') {
            pam_re_rev += '[AG]'
        } else if (pam_rev[i] === 'W') {
            pam_re_rev += '[AT]'
        } else if (pam_rev[i] === 'M') {
            pam_re_rev += '[AC]'
        } else if (pam_rev[i] === 'Y') {
            pam_re_rev += '[CT]'
        } else if (pam_rev[i] === 'S') {
            pam_re_rev += '[GC]'
        } else if (pam_rev[i] === 'K') {
            pam_re_rev += '[GT]'
        } else if (pam_rev[i] === 'B') {
            pam_re_rev += '[CGT]'
        } else if (pam_rev[i] === 'D') {
            pam_re_rev += '[AGT]'
        } else if (pam_rev[i] === 'H') {
            pam_re_rev += '[ACT]'
        } else if (pam_rev[i] === 'V') {
            pam_re_rev += '[ACG]'
        } else {
            pam_re_rev += pam_rev[i]
        }
    }

	var padding5 = len_grna + 5;
    var padding3 = 5;
    var matches = '';
    var first_grna = new RegExp("[\\D]{" + padding5 + "}" + pam_re + "[\\D]{" + padding3 + "}", 'gi');
    var first_grna_r = new RegExp("[\\D]{" + padding3 + "}" + pam_re_rev + "[\\D]{" + padding5 + "}", 'gi');
    var first_pam = new RegExp("[\\D]{" + padding3 + "}" + pam_re + "[\\D]{" + padding5 + "}", 'gi'); //Cas12a
    var first_pam_r = new RegExp("[\\D]{" + padding5 + "}" + pam_re_rev + "[\\D]{" + padding3 + "}", 'gi'); //Cas12a

    if (reverse) { //Cas12a
        while (matches = first_pam.exec(dna_string)) {
            grna_info.push([matches[0], matches.index + pam.length, matches.index + pam.length + len_grna, '+']);
            first_pam.lastIndex -= (matches[0].length - 1);
        }
        while (matches = first_pam_r.exec(reverse_complement(dna_string, false, true))) {
            grna_info.push([matches[0], matches.index, matches.index + len_grna, '-']);
            first_pam_r.lastIndex -= (matches[0].length - 1);
        }

    } else { //Cas9
        while (matches = first_grna.exec(dna_string)) {
            grna_info.push([matches[0], matches.index, matches.index + len_grna, '+']);
            first_grna.lastIndex -= (matches[0].length - 1);
        }
        while (matches = first_grna_r.exec(reverse_complement(dna_string, false, true))) {
            console.log(matches)
            grna_info.push([matches[0], matches.index + pam.length, matches.index + pam.length + len_grna, '-']);
            first_grna_r.lastIndex -= (matches[0].length - 1);
        }
    }
	

    return grna_info
}

function trim(s) {
    return s.replace(/(^\s*)|(\s*$)|[\r\n]|[#]/g, "");
}

module.exports.reverse_complement = reverse_complement;
module.exports.find_grna = find_grna;
module.exports.trim = trim;

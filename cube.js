/*
Cube representation. Eight corners (c) with three orientations. Twelve edges (e) which may be flipped.
Separately (not strictly part of the cube), a view (v) specifying U, D, L, R, F, B. This controls the "camera" when displaying.

Corners (above view);

  Permutation: Top: 1 4  Bottom: 5 8
                    2 3          6 7

  Orientation: 1 = U/D on F/B
               2 = U/D on L/R
               3 = U/D on U/D (oriented)

Edges (above view):

  Permutation: Top:   1    Middle: 5  8  Bottom:    9
                    2   4                        10  12
                      3            6  7            11

  Orientation: F/B moves flip (not F2/B2, which is like F F; canceling)

Permutation of zero (0) means that this piece is not to be considered in comparisons and renders gray.
*/

var Cube = (function () {
    var solved = {
        c: [{ p: 1, o: 3 },
            { p: 2, o: 3 },
            { p: 3, o: 3 },
            { p: 4, o: 3 },
            { p: 5, o: 3 },
            { p: 6, o: 3 },
            { p: 7, o: 3 },
            { p: 8, o: 3 }],
        e: [{ p: 1, o: 1 },
            { p: 2, o: 1 },
            { p: 3, o: 1 },
            { p: 4, o: 1 },
            { p: 5, o: 1 },
            { p: 6, o: 1 },
            { p: 7, o: 1 },
            { p: 8, o: 1 },
            { p: 9, o: 1 },
            { p: 10, o: 1 },
            { p: 11, o: 1 },
            { p: 12, o: 1 }],
        v: [0, 1, 2, 3, 4, 5],
        m: {}
    }

    function compare(cube0, cube1) {
        for (var c = 0; c < 8; c++) {
            var c0 = cube0.c[c];
            var c1 = cube1.c[c];
            if (c0.p != 0 && c1.p != 0 && (c0.p != c1.p || c0.o != c1.o)) return false;
        }
        for (var e = 0; e < 12; e++) {
            var e0 = cube0.e[e];
            var e1 = cube1.e[e];
            if (e0.p != 0 && e1.p != 0 && (e0.p != e1.p || e0.o != e1.o)) return false;
        }
        return true;
    }

    function map(mapping, cube) {
        // corners
        function co(m, o) {
            if (m) {
                switch (m) {
                    case 0: return o;
                    case 1: return o == 1 ? 1 : o == 2 ? 3 : 2;
                    case 2: return o == 2 ? 2 : o == 1 ? 3 : 1;
                    case 3: return o == 3 ? 3 : o == 2 ? 1 : 2;
                }
            } else return o;
        }
        var cs = cube.c.slice(0);
        if (mapping.c) {
            for (var j in mapping.c) {
                var m = mapping.c[j];
                var i = m.i;
                var n = m.p || i;
                var x = cube.c[n - 1];
                var c = { o: x.o, p: x.p }; // clone
                c.o = co(m.o, c.o);
                cs[i - 1] = c;
            }
        }
        // edges
        function eo(m, o) {
            if (m) {
                return m == 1 ? o == 1 ? 2 : 1 : o;
            } else return o;
        }
        var es = cube.e.slice(0);
        if (mapping.e) {
            for (var j in mapping.e) {
                var m = mapping.e[j];
                var i = m.i;
                var n = m.p || i;
                var x = cube.e[n - 1];
                var e = { o: x.o, p: x.p }; // clone
                e.o = eo(m.o, e.o);
                es[i - 1] = e;
            }
        }
        // view
        var vs = cube.v.slice(0);
        if (mapping.v) {
            var m = mapping.v;
            for (var i = 0; i < 6; i++) {
                vs[i] = cube.v[m[i]];
            }
        }

        var ms = JSON.parse(JSON.stringify(cube.m));

        return { c: cs, e: es, v: vs, m: ms };
    }

    var orientations = [
        [0, 1, 2, 3, 4, 5], // YR
        [4, 5, 3, 2, 0, 1], // RY
        [0, 1, 4, 5, 3, 2], // YG
        [3, 2, 5, 4, 0, 1], // GY
        [0, 1, 3, 2, 5, 4], // YO
        [5, 4, 2, 3, 0, 1], // OY
        [0, 1, 5, 4, 2, 3], // YB
        [2, 3, 4, 5, 0, 1], // BY
        [3, 2, 0, 1, 4, 5], // GR
        [4, 5, 1, 0, 3, 2], // RG
        [5, 4, 0, 1, 3, 2], // OG
        [3, 2, 1, 0, 5, 4], // GO
        [2, 3, 0, 1, 5, 4], // BO
        [5, 4, 1, 0, 2, 3], // OB
        [4, 5, 0, 1, 2, 3], // RB
        [2, 3, 1, 0, 4, 5], // BR
        [1, 0, 3, 2, 4, 5], // WR
        [4, 5, 2, 3, 1, 0], // RW
        [1, 0, 4, 5, 2, 3], // WB
        [2, 3, 5, 4, 1, 0], // BW
        [1, 0, 2, 3, 5, 4], // WO
        [5, 4, 3, 2, 1, 0], // OW
        [1, 0, 5, 4, 3, 2], // WG
        [3, 2, 4, 5, 1, 0]] // GW

    function same(cube0, cube1) {
        // compare all (24) orientations
        for (o in orientations) {
            if (compare(map({ v: orientations[o] }, cube0), cube1)) return true;
        }
        return false;
    }

    function twist(notation, cube) {
        var maps = [ // U, D, L, R, F, B twists in original orientation (remapped as necessary below)
            { c: [{ i: 1, p: 2, o: 3 }, { i: 2, p: 3, o: 3 }, { i: 3, p: 4, o: 3 }, { i: 4, p: 1, o: 3 }],
            e: [{ i: 1, p: 2 }, { i: 2, p: 3 }, { i: 3, p: 4 }, { i: 4, p: 1 }]},
            { c: [{ i: 5, p: 8, o: 3 }, { i: 6, p: 5, o: 3 }, { i: 7, p: 6, o: 3 }, { i: 8, p: 7, o: 3 }],
            e: [{ i: 9, p: 12 }, { i: 10, p: 9 }, { i: 11, p: 10 }, { i: 12, p: 11 }]},
            { c: [{ i: 1, p: 5, o: 2 }, { i: 2, p: 1, o: 2 }, { i: 5, p: 6, o: 2 }, { i: 6, p: 2, o: 2 }],
            e: [{ i: 2, p: 5 }, { i: 6, p: 2 }, { i: 10, p: 6 }, { i: 5, p: 10 }]},
            { c: [{ i: 3, p: 7, o: 2 }, { i: 4, p: 3, o: 2 }, { i: 7, p: 8, o: 2 }, { i: 8, p: 4, o: 2 }],
            e: [{ i: 4, p: 7 }, { i: 7, p: 12 }, { i: 8, p: 4 }, { i: 12, p: 8 }]},
            { c: [{ i: 2, p: 6, o: 1 }, { i: 3, p: 2, o: 1 }, { i: 6, p: 7, o: 1 }, { i: 7, p: 3, o: 1 }],
            e: [{ i: 3, p: 6, o: 1 }, { i: 6, p: 11, o: 1 }, { i: 7, p: 3, o: 1 }, { i: 11, p: 7, o: 1 }]},
            { c: [{ i: 1, p: 4, o: 1 }, { i: 4, p: 8, o: 1 }, { i: 5, p: 1, o: 1 }, { i: 8, p: 5, o: 1 }],
            e: [{ i: 1, p: 8, o: 1 }, { i: 5, p: 1, o: 1 }, { i: 8, p: 9, o: 1 }, { i: 9, p: 5, o: 1 }]}];
        var u = maps[cube.v[0]];
        var d = maps[cube.v[1]];
        var l = maps[cube.v[2]];
        var r = maps[cube.v[3]];
        var f = maps[cube.v[4]];
        var b = maps[cube.v[5]];
        var x = { v: [4, 5, 2, 3, 1, 0] };
        var y = { v: [0, 1, 4, 5, 3, 2] };
        var z = { v: [2, 3, 1, 0, 4, 5] };
        switch (notation) {
            case "": return cube; // null move
            // normal moves
            case "U": return map(u, cube);
            case "U2":
            case "U2'": return map(u, map(u, cube));
            case "U'": return map(u, map(u, map(u, cube)));
            case "D": return map(d, cube);
            case "D2":
            case "D2'": return map(d, map(d, cube));
            case "D'": return map(d, map(d, map(d, cube)));
            case "L": return map(l, cube);
            case "L2":
            case "L2'": return map(l, map(l, cube));
            case "L'": return map(l, map(l, map(l, cube)));
            case "R": return map(r, cube);
            case "R2":
            case "R2'": return map(r, map(r, cube));
            case "R'": return map(r, map(r, map(r, cube)));
            case "F": return map(f, cube);
            case "F2":
            case "F2'": return map(f, map(f, cube));
            case "F'": return map(f, map(f, map(f, cube)));
            case "B": return map(b, cube);
            case "B2":
            case "B2'": return map(b, map(b, cube));
            case "B'": return map(b, map(b, map(b, cube)));
            // slice moves
            case "M": return map(l, map(l, map(l, map(r, map(x, map(x, map(x, cube)))))));
            case "M2":
            case "M2'": return map(l, map(l, map(r, map(r, map(x, map(x, cube))))));
            case "M'": return map(l, map(r, map(r, map(r, map(x, cube)))));
            case "E": return map(u, map(d, map(d, map(d, map(y, map(y, map(y, cube)))))));
            case "E2":
            case "E2'": return map(u, map(u, map(d, map(d, map(y, map(y, cube))))));
            case "E'": return map(u, map(u, map(u, map(d, map(y, cube)))));
            case "S": return map(f, map(f, map(f, map(b, map(z, cube)))));
            case "S2":
            case "S2'": return map(f, map(f, map(b, map(b, map(z, map(z, cube))))));
            case "S'": return map(f, map(b, map(b, map(b, map(z, map(z, map(z, cube)))))));
            // wide moves
            case "u":
            case "Uw": return map(y, map(d, cube));
            case "u2":
            case "u2'":
            case "Uw2":
            case "Uw2'": return map(y, map(y, map(d, map(d, cube))));
            case "u'":
            case "Uw'": return map(y, map(y, map(y, map(d, map(d, map(d, cube))))));
            case "d":
            case "Dw": return map(y, map(y, map(y, map(u, cube))));
            case "d2":
            case "d2'":
            case "Dw2":
            case "Dw2'": return map(y, map(y, map(u, map(u, cube))));
            case "d'":
            case "Dw'": return map(y, map(u, map(u, cube)));
            case "l":
            case "Lw": return map(x, map(x, map(x, map(r, cube))));
            case "l2":
            case "l2'":
            case "Lw2":
            case "Lw2'": return map(x, map(x, map(r, map(r, cube))));
            case "l'":
            case "Lw'": return map(x, map(r, map(r, map(r, cube))));
            case "r":
            case "Rw": return map(x, map(l, cube));
            case "r2":
            case "r2'":
            case "Rw2":
            case "Rw2'": return map(x, map(x, map(l, map(l, cube))));
            case "r'":
            case "Rw'": return map(x, map(x, map(x, map(l, map(l, map(l, cube))))));
            case "f":
            case "Fw": return map(z, map(b, cube));
            case "f2":
            case "f2'":
            case "Fw2":
            case "Fw2'": return map(z, map(z, map(b, map(b, cube))));
            case "f'":
            case "Fw'": return map(z, map(z, map(z, map(b, map(b, map(b, cube))))));
            case "b":
            case "Bw": return map(z, map(z, map(z, map(f, cube))));
            case "b2":
            case "b2'":
            case "Bw2":
            case "Bw2'": return map(z, map(z, map(f, map(f, cube))));
            case "b'":
            case "Bw'": return map(z, map(f, map(f, map(f, cube))));
            // relative cube orientations
            case "x": return map(x, cube);
            case "x2": return map(x, map(x, cube));
            case "x'": return map(x, map(x, map(x, cube)));
            case "y": return map(y, cube);
            case "y2": return map(y, map(y, cube));
            case "y'": return map(y, map(y, map(y, cube)));
            case "z": return map(z, cube);
            case "z2": return map(z, map(z, cube));
            case "z'": return map(z, map(z, map(z, cube)));
            default: throw "Unknown notation: " + notation;
        }
    }
    
    function inverseAlg(twists) {
        var rev = twists.reverse();
        for (var i = 0; i < rev.length; i++) {
            var r = rev[i];
            if (r == "") {
                twists[i] = "";
                continue;
            }
            var m = r.length - 1;
            switch (r[m]) {
                case "'":
                    twists[i] = r.substr(0, m);
                    break;
                case "2":
                    twists[i] = r;
                    break;
                default:
                    twists[i] = r + "'";
                    break;
            }
        }
        return twists;
    }

    function alg(alg, cube, inverse) {
        var twists = alg.split(' ');
        if (inverse) twists = inverseAlg(twists);
        for (var t in twists) {
            cube = twist(twists[t], cube);
        }
        return cube;
    }

    function random(algs, n, cube) {
        for (var i = 0; i < n; i++) {
            cube = alg(algs[Math.floor(Math.random() * algs.length)], cube);
        }
        return cube;
    }

    function canonical(face) {
        return face.split('').sort().join('');
    }

    const corners = {
        "UBL": 1,
        "ULF": 2,
        "UFR": 3,
        "URB": 4,
        "DLB": 5,
        "DFL": 6,
        "DRF": 7,
        "DBR": 8,
        // canonical order also
        "BLU": 1,
        "FLU": 2,
        "FRU": 3,
        "BRU": 4,
        "BDL": 5,
        "DFR": 7,
        "BDR": 8 };
    var cornerKeys = Object.keys(corners);
    function cornerNum(corner) { return corners[corner.toUpperCase()]; }
    
    const edges = {
        "UB": 1,
        "UL": 2,
        "UF": 3,
        "UR": 4,
        "BL": 5,
        "FL": 6,
        "FR": 7,
        "BR": 8,
        "DB": 9,
        "DL": 10,
        "DF": 11,
        "DR": 12,
        // canonical order also
        "BU": 1,
        "LU": 2,
        "FU": 3,
        "RU": 4,
        "BD": 9 };
    var edgeKeys = Object.keys(edges);
    function edgeNum(edge) { return edges[edge.toUpperCase()]; }
    
    const centers = {
        "U": 0,
        "D": 1,
        "L": 2,
        "R": 3,
        "F": 4,
        "B": 5 };
    var centerKeys = Object.keys(centers);
    function centerNum(center) { return centers[center.toUpperCase()]; }

    function getPiece(piece, cube) {
        if (piece.length == 1) { // center
            return centerKeys[cube.v[centerNum(piece)]];
        } else {
            var pov = "";
            for (var i = 0; i < piece.length; i++) {
                pov += centerKeys[cube.v[centers[piece[i]]]];
            }
            pov = canonical(pov);
            switch (piece.length) {
                case 2: // edge
                    return edgeKeys[cube.e[edgeNum(pov) - 1].p - 1];
                case 3: // corner
                    return cornerKeys[cube.e[cornerNum(pov) - 1].p - 1];
                default: throw "Invalid piece name: " + piece;
            }
        }
    }

    function maskPieces(pieces, cube) {
        var cs = cube.c.slice(0);
        var es = cube.e.slice(0);
        var vs = cube.v.slice(0);
        var ms = JSON.parse(JSON.stringify(cube.m));
        for (var p in pieces) {
            ms[canonical(getPiece(pieces[p], cube))] = true;
        }
        return { c: cs, e: es, v: vs, m: ms };
    }

    function faces(cube, simple) {
        function twistColors(colors, corner, twist) {
            var c0 = colors[0];
            var c1 = colors[1];
            var c2 = colors[2];
            var lastToFront = corner == 0 || corner == 2 || corner == 5 || corner == 7;
            switch (twist) {
                case 1: return lastToFront ? c2 + c0 + c1 : c1 + c2 + c0;
                case 2: return lastToFront ? c1 + c2 + c0 : c2 + c0 + c1;
                case 3: return colors; // no twist
            }
        }

        var faces = {
            // centers (orientation)
            _U: centerKeys[cube.v[0]],
            _D: centerKeys[cube.v[1]],
            _L: centerKeys[cube.v[2]],
            _R: centerKeys[cube.v[3]],
            _F: centerKeys[cube.v[4]],
            _B: centerKeys[cube.v[5]],
            // center colors
            U: simple && cube.m[centerKeys[cube.v[0]]] ? '.' : centerKeys[cube.v[0]],
            D: simple && cube.m[centerKeys[cube.v[1]]] ? '.' : centerKeys[cube.v[1]],
            L: simple && cube.m[centerKeys[cube.v[2]]] ? '.' : centerKeys[cube.v[2]],
            R: simple && cube.m[centerKeys[cube.v[3]]] ? '.' : centerKeys[cube.v[3]],
            F: simple && cube.m[centerKeys[cube.v[4]]] ? '.' : centerKeys[cube.v[4]],
            B: simple && cube.m[centerKeys[cube.v[5]]] ? '.' : centerKeys[cube.v[5]],
        }

        // corners
        for (var c = 0; c < 8; c++) {
            var p = cube.c[c].p;
            if (p != 0) {
                var colors = twistColors(cornerKeys[p - 1], c, cube.c[c].o);
                var c0 = colors[0];
                var c1 = colors[1];
                var c2 = colors[2];
                var targets = cornerKeys[c].toLowerCase();
                var t0 = targets[0];
                var t1 = targets[1];
                var t2 = targets[2];
                var masked = simple && cube.m[canonical(c0 + c1 + c2).toUpperCase()];
                faces[canonical(t0.toUpperCase() + t1 + t2)] = masked ? '.' : c0;
                faces[canonical(t0 + t1.toUpperCase() + t2)] = masked ? '.' : c1;
                faces[canonical(t0 + t1 + t2.toUpperCase())] = masked ? '.' : c2;
            }
        }

        // edges
        for (var e = 0; e < 12; e++) {
            var p = cube.e[e].p;
            if (p != 0) {
                var colors = edgeKeys[p - 1];
                var flipped = cube.e[e].o == 2;
                var c0 = flipped ? colors[1] : colors[0];
                var c1 = flipped ? colors[0] : colors[1];
                var edge = edgeKeys[e].toLowerCase();
                var masked = simple && cube.m[canonical(c0 + c1).toUpperCase()];
                faces[canonical(edge[0].toUpperCase() + edge[1])] = masked ? '.' : c0;
                faces[canonical(edge[0] + edge[1].toUpperCase())] = masked ? '.' : c1;
            }
        }

        return faces;
    }

    function faceColor(face, faces) {
        if (face.length == 1) return faces[face];
        var pov = "";
        for (var i = 0; i < face.length; i++) {
            var f = face[i].toUpperCase();
            var m = faces['_' + f]; // map to pov
            pov += (f != face[i] ? m.toLowerCase() : m); // match case
        }
        return faces[canonical(pov)];
    }

    function toString(cube) {
        var fs = faces(cube);
        var str = "";
        var order = ["Ubl", "Ub", "Ubr", "Ul", "U", "Ur", "Ufl", "Uf", "Ufr", // U
                     "uLb", "uL", "ufL", "bL", "L", "fL", "dbL", "dL", "dfL", // L
                     "uFl", "uF", "uFr", "Fl", "F", "Fr", "dFl", "dF", "dFr", // F
                     "ufR", "uR", "ubR", "fR", "R", "bR", "dfR", "dR", "dbR", // R
                     "Dfl", "Df", "Dfr", "Dl", "D", "Dr", "Dbl", "Db", "Dbr", // D
                     "Bdl", "Bd", "Bdr", "Bl", "B", "Br", "Bul", "Bu", "Bur"] // B
        for (var i = 0; i < order.length; i++) {
            str += faceColor(order[i], fs);
        }
        return str;
    }

    function matchPattern(pattern, cube) {
        var state = toString(cube);
        var mapping = {};
        for (var i in pattern) {
            var p = pattern[i];
            if (p != '.') {
                if (!mapping[p]) {
                    mapping[p] = state[i];
                    continue;
                }
                if (mapping[p] != state[i]) return false;
            }
        }
        return true;
    }

    return {
        solved: solved,
        alg: alg,
        random: random,
        same: same,
        faces: faces,
        faceColor: faceColor,
        toString: toString,
        matchPattern: matchPattern,
        getPiece: getPiece,
        maskPieces: maskPieces
    }
}());
/*
Roofpig integration
Assumes an element with ID of "cube" in which to render.
*/
var Display = (function () {
    var corners = ["UBL", "ULF", "UFR", "URB", "DLB", "DFL", "DRF", "DBR"]
    var edges = ["UB", "UL", "UF", "UR", "BL", "FL", "FR", "BR", "DB", "DL", "DF", "DR"];

    const gray = "#222";
    const purple = "#B4F";

    function faceToCssColor(face) {
        switch (face) {
            case 'U': return Settings.values.colorSchemeU || "#EF0";
            case 'D': return Settings.values.colorSchemeD || "#FFF";
            case 'L': return Settings.values.colorSchemeL || "#08F";
            case 'R': return Settings.values.colorSchemeR || "#0C0";
            case 'F': return Settings.values.colorSchemeF || "#F10";
            case 'B': return Settings.values.colorSchemeB || "#F90";
            case '.': return gray;
            default: throw "Unknown face: " + face;
        }
    }

    function dim(col) {
        function dimChannel(c) {
            switch (c) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                    return '0';
                case '7': return '1';
                case '8': return '2';
                case '9': return '3';
                case 'A': return '4';
                case 'B': return '5';
                case 'C': return '6';
                case 'D': return '7';
                case 'E': return '8';
                case 'F': return '9';
            }
        }
        return '#' + dimChannel(col[1]) + dimChannel(col[2]) + dimChannel(col[3]);
    }

    function faceColor(face, faces) {
        return faceToCssColor(Cube.faceColor(face, faces));
    }

    function maskPieces(simplified, cube) {
        if (simplified.hideULayer) {
            cube = Cube.maskPieces(["U", "UB", "UF", "UL", "UR", "UBL", "UFR", "ULF", "URB"], cube);
        }
        if (simplified.hideMSlice) {
            cube = Cube.maskPieces(["U", "D", "F", "B", "UF", "UB", "DF", "DB"], cube);
        }
        return cube;
    }

    function diagram(cube, diag, id, simple, hide, size) {
        switch (diag.type) {
            case "up": return diagramLL(Cube.faces(cube, simple), diag, simple, hide, size);
            case "up-front": return diagramUF(cube, diag, simple, false, size);
            case "up-front-ul-ur": return diagramUF(cube, diag, simple, true, size);
            case "up-front-right": return diagramUFR(cube, simple, size, "");
            case "blind": return diagramUFR(cube, simple, size, id);
            default: throw "Unknown diagram type: " + diag.type;
        }
    }

    function diagramAlg(rot, auf, alg, size) {
        var algTwists = auf + alg.alg;
        var diag = Algs.kindToParams(alg.kind).diagram;
        switch (diag.type) {
            case "up": return diagramLLAlg(rot, algTwists, diag, size);
            case "up-front": return diagramUFAlg(rot, algTwists, diag, size);
            case "up-front-ul-ur": return diagramUFULURAlg(rot, algTwists, diag, size);
            case "up-front-right": return diagramUFRAlg(rot, algTwists, alg.kind, size, "");
            case "blind": return diagramBLD(alg.id, size);
            default: throw "Unknown diagram type: " + diag.type;
        }
    }

    function diagramBLD(label, size) {
        return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                   'width="' + (size || '100vmin') + '" height="' + (size || '100vmin') + '" viewBox="-0.9 -0.9 1.8 1.8">' +
                   '<g>' +
                       '<rect fill="black" x="-0.8" y="-0.8" width="1.6" height="1.6"/>' +
                           '<text fill="white" font-size="0.5" dy="0.05" dominant-baseline="middle" text-anchor="middle">' + label.toUpperCase() + '</text>' +
                       '</rect>' +
                   '</g>' +
               '</svg>';
    }

    function diagramLLAlg(rot, alg, diag, size) {
        return diagramLL(Cube.faces(Cube.alg(alg, Cube.alg(rot, Cube.solved), true), true), diag, true, "show_all", size);
    }

    function diagramLL(faces, diag, simple, hide, size) {
        function col(face) {
            var col = faceColor(face, faces);
            if (
                (face.indexOf('B') != -1 && hide && hide.indexOf("_back") != -1) ||
                (face.indexOf('L') != -1 && hide && hide.indexOf("_left") != -1) ||
                (face.indexOf('R') != -1 && hide && hide.indexOf("_right") != -1)) {
                col = gray;
            }
            if (simple) {
                switch (face.length) {
                    case 1:
                        if (diag.simplified.hideUCenter) {
                            var upcols = Settings.values.upColors;
                            var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                            return numColors > 1 && !diag.simplified.hideInsignificantCornerFaces ? col : gray;
                        }
                        break;
                    case 2:
                        if (diag.simplified.hideEdges) {
                            return diag.simplified.showEdgeU && face.indexOf('U') != -1 ? col : gray;
                        }
                        else if (diag.simplified.hideInsignificantEdgeFaces) {
                            return col == faceColor("U", faces) ? col : gray;
                        }
                        break;
                    case 3:
                        if (diag.simplified.hideCorners) {
                            return gray;
                        }
                        else if (diag.simplified.hideInsignificantCornerFaces) {
                            var ucol = faceColor("U", faces);
                            if (col == ucol) return col;
                            var cornersOriented = faceColor("Ubl", faces) == ucol && faceColor("Urb", faces) == ucol && faceColor("Ulf", faces) == ucol && faceColor("Ufr", faces) == ucol;
                            if (cornersOriented) {
                                switch (face) {
                                    case "uBl":
                                        if (faceColor("urB", faces) == col) return purple;
                                        break;
                                    case "urB":
                                        if (faceColor("uBl", faces) == col) return purple;
                                        break;
                                    case "ubL":
                                        if (faceColor("uLf", faces) == col) return purple;
                                        break;
                                    case "uLf":
                                        if (faceColor("ubL", faces) == col) return purple;
                                        break;
                                    case "uRb":
                                        if (faceColor("ufR", faces) == col) return purple;
                                        break;
                                    case "ufR":
                                        if (faceColor("uRb", faces) == col) return purple;
                                        break;
                                    case "ulF":
                                        if (faceColor("uFr", faces) == col) return purple;
                                        break;
                                    case "uFr":
                                        if (faceColor("ulF", faces) == col) return purple;
                                        break;
                                }
                            }
                            return gray;
                        }
                        break;
                }
                return col;
            } else {
                return col;
            }
        }
        return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                   'style="max-width: 60vh; max-height: 70vh"' +
                   'width="' + (size || '100vmin') + '" height="' + (size || '100vmin') + '" viewBox="-0.9 -0.9 1.8 1.8">' +
                   '<rect fill="transparent" x="-0.9" y="-0.9" width="1.8" height="1.8"/>' +
                   '<g style="stroke-width:0.1;stroke-linejoin:round;opacity:1">' +
                       '<polygon fill="#000000" stroke="#000000" points="-0.522222222222,-0.522222222222 0.522222222222,-0.522222222222 0.522222222222,0.522222222222 -0.522222222222,0.522222222222"/>' +
                   '</g>' +
                   '<g style="opacity:1;stroke-opacity:0.5;stroke-width:0;stroke-linejoin:round">' +
                       '<polygon id="Ubl" fill="' + col("Ubl") + '" stroke="#000000" points="-0.527777777778,-0.527777777778 -0.212962962963,-0.527777777778 -0.212962962963,-0.212962962963 -0.527777777778,-0.212962962963"/>' +
                       '<polygon id="Ub" fill="' + col("Ub") + '" stroke="#000000" points="-0.157407407407,-0.527777777778 0.157407407407,-0.527777777778 0.157407407407,-0.212962962963 -0.157407407407,-0.212962962963"/>' +
                       '<polygon id="Urb" fill="' + col("Urb") + '" stroke="#000000" points="0.212962962963,-0.527777777778 0.527777777778,-0.527777777778 0.527777777778,-0.212962962963 0.212962962963,-0.212962962963"/>' +
                       '<polygon id="Ul" fill="' + col("Ul") + '" stroke="#000000" points="-0.527777777778,-0.157407407407 -0.212962962963,-0.157407407407 -0.212962962963,0.157407407407 -0.527777777778,0.157407407407"/>' +
                       '<polygon id="U" fill="' + col("U") + '" stroke="#000000" points="-0.157407407407,-0.157407407407 0.157407407407,-0.157407407407 0.157407407407,0.157407407407 -0.157407407407,0.157407407407"/>' +
                       '<polygon id="Ur" fill="' + col("Ur") + '" stroke="#000000" points="0.212962962963,-0.157407407407 0.527777777778,-0.157407407407 0.527777777778,0.157407407407 0.212962962963,0.157407407407"/>' +
                       '<polygon id="Ulf" fill="' + col("Ulf") + '" stroke="#000000" points="-0.527777777778,0.212962962963 -0.212962962963,0.212962962963 -0.212962962963,0.527777777778 -0.527777777778,0.527777777778"/>' +
                       '<polygon id="Uf" fill="' + col("Uf") + '" stroke="#000000" points="-0.157407407407,0.212962962963 0.157407407407,0.212962962963 0.157407407407,0.527777777778 -0.157407407407,0.527777777778"/>' +
                       '<polygon id="Ufr" fill="' + col("Ufr") + '" stroke="#000000" points="0.212962962963,0.212962962963 0.527777777778,0.212962962963 0.527777777778,0.527777777778 0.212962962963,0.527777777778"/>' +
                   '</g>' +
                   '<g style="opacity:1;stroke-opacity:1;stroke-width:0.02;stroke-linejoin:round">' +
                       '<polygon id="uBl" fill="' + col("uBl") + '" stroke="#000000" points="-0.195146871009,-0.554406130268 -0.543295019157,-0.554406130268 -0.507279693487,-0.718390804598 -0.183141762452,-0.718390804598"/>' +
                       '<polygon id="uB" fill="' + col("uB") + '" stroke="#000000" points="0.174457215837,-0.554406130268 -0.173690932312,-0.554406130268 -0.161685823755,-0.718390804598 0.16245210728,-0.718390804598"/>' +
                       '<polygon id="urB" fill="' + col("urB") + '" stroke="#000000" points="0.544061302682,-0.554406130268 0.195913154534,-0.554406130268 0.183908045977,-0.718390804598 0.508045977011,-0.718390804598"/>' +
                       '<polygon id="ubL" fill="' + col("ubL") + '" stroke="#000000" points="-0.554406130268,-0.544061302682 -0.554406130268,-0.195913154534 -0.718390804598,-0.183908045977 -0.718390804598,-0.508045977011"/>' +
                       '<polygon id="uL" fill="' + col("uL") + '" stroke="#000000" points="-0.554406130268,-0.174457215837 -0.554406130268,0.173690932312 -0.718390804598,0.161685823755 -0.718390804598,-0.16245210728"/>' +
                       '<polygon id="uLf" fill="' + col("uLf") + '" stroke="#000000" points="-0.554406130268,0.195146871009 -0.554406130268,0.543295019157 -0.718390804598,0.507279693487 -0.718390804598,0.183141762452"/>' +
                       '<polygon id="uRb" fill="' + col("uRb") + '" stroke="#000000" points="0.554406130268,-0.195146871009 0.554406130268,-0.543295019157 0.718390804598,-0.507279693487 0.718390804598,-0.183141762452"/>' +
                       '<polygon id="uR" fill="' + col("uR") + '" stroke="#000000" points="0.554406130268,0.174457215837 0.554406130268,-0.173690932312 0.718390804598,-0.161685823755 0.718390804598,0.16245210728"/>' +
                       '<polygon id="ufR" fill="' + col("ufR") + '" stroke="#000000" points="0.554406130268,0.544061302682 0.554406130268,0.195913154534 0.718390804598,0.183908045977 0.718390804598,0.508045977011"/>' +
                       '<polygon id="ulF" fill="' + col("ulF") + '" stroke="#000000" points="-0.544061302682,0.554406130268 -0.195913154534,0.554406130268 -0.183908045977,0.718390804598 -0.508045977011,0.718390804598"/>' +
                       '<polygon id="uF" fill="' + col("uF") + '" stroke="#000000" points="-0.174457215837,0.554406130268 0.173690932312,0.554406130268 0.161685823755,0.718390804598 -0.16245210728,0.718390804598"/>' +
                       '<polygon id="uFr" fill="' + col("uFr") + '" stroke="#000000" points="0.195146871009,0.554406130268 0.543295019157,0.554406130268 0.507279693487,0.718390804598 0.183141762452,0.718390804598"/>' +
                   '</g>' +
               '</svg>';
    }

    function diagramUFAlg(rot, alg, diag, size) {
        return diagramUF(Cube.alg(alg, Cube.alg(rot, Cube.solved), true), diag, true, false, size);
    }

    function diagramUFULURAlg(rot, alg, diag, size) {
        return diagramUF(Cube.alg("U' " + alg, Cube.alg(rot, Cube.solved), true), diag, true, true, size);
    }

    function diagramUF(cube, diag, simple, showLR, size) {
        function edgeIsFlipped(edge, faces, u, d) {
            if (edge[0] == "U" || edge[0] == "D") { // only U/D edges
                udEdge = edge[0] + edge[1].toLowerCase();
                var c = Cube.faceColor(udEdge, faces);
                return c != u && c != d;
            }
            return false;
        }
        var faces = Cube.faces(cube, simple);
        function col(face) {
            var edge = face.length == 2 ? face.toUpperCase() : undefined;
            var col = faceColor(face, faces);
            if (diag.eo) {
                var u = Cube.faceColor("Ubl", faces); // assumes top corners oriented
                var d = Cube.faceColor("Dbl", faces); // assumes FB solved
                return simple ? (edge && edgeIsFlipped(edge, faces, u, d) ? purple : gray) : col;
            } else {
                if (simple) {
                    switch (face) {
                        case "ulF":
                        case "uFr":
                        case "Fl":
                        case "Fr":
                        case "dFl":
                        case "drF":
                        case "Ubl":
                        case "Urb":
                        case "Ulf":
                        case "Ufr":
                            return dim(col);
                        default: return col;
                    }
                } else {
                    return col;
                }
            }
        }
        return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                   'width="' + (size || '100vmin') + '" height="' + (size || '100vmin') + '" viewBox="-0.9 -0.9 1.8 1.8">' +
                   '<rect fill="transparent" x="-0.9" y="-0.9" width="1.8" height="1.8"/>' +
                   '<g style="stroke-width:0.1;stroke-linejoin:round;opacity:1">' +
                       '<polygon fill="#000" stroke="#000000" points="-0.547416364726,6.07754252175E-17 0.547416364726,6.07754252175E-17 0.47,0.664680374315 -0.47,0.664680374315"/>' +
                       '<polygon fill="#000" stroke="#000000" points="-0.47,-0.664680374315 0.47,-0.664680374315 0.547416364726,6.07754252175E-17 -0.547416364726,6.07754252175E-17"/>' +
                   '</g>' +
                   '<g style="opacity:1;stroke-opacity:0.5;stroke-width:0;stroke-linejoin:round">' +
                       '<polygon id="ulF" fill="' + col("ulF") + '" stroke="#000000" points="-0.552482185737,0.0195178280008 -0.222479412675,0.0195178280008 -0.21389149619,0.240719878676 -0.52671843628,0.240719878676"/>' +
                       '<polygon id="uF" fill="' + col("uF") + '" stroke="#000000" points="-0.165759143868,0.0195178280008 0.164243629194,0.0195178280008 0.155655712708,0.240719878676 -0.157171227382,0.240719878676"/>' +
                       '<polygon id="uFr" fill="' + col("uFr") + '" stroke="#000000" points="0.220963898001,0.0195178280008 0.550966671063,0.0195178280008 0.525202921606,0.240719878676 0.212375981516,0.240719878676"/>' +
                       '<polygon id="Fl" fill="' + col("Fl") + '" stroke="#000000" points="-0.523762383403,0.277824338758 -0.210935443313,0.277824338758 -0.203197260173,0.477139502342 -0.500547833981,0.477139502342"/>' +
                       '<polygon id="F" fill="' + col("F") + '" stroke="#000000" points="-0.15709625091,0.277824338758 0.15573068918,0.277824338758 0.147992506039,0.477139502342 -0.14935806777,0.477139502342"/>' +
                       '<polygon id="Fr" fill="' + col("Fr") + '" stroke="#000000" points="0.209569881583,0.277824338758 0.522396821673,0.277824338758 0.49918227225,0.477139502342 0.201831698442,0.477139502342"/>' +
                       '<polygon id="dFl" fill="' + col("dFl") + '" stroke="#000000" points="-0.497881083717,0.51065468293 -0.200530509908,0.51065468293 -0.193521889671,0.691178232679 -0.476855223004,0.691178232679"/>' +
                       '<polygon id="dF" fill="' + col("dF") + '" stroke="#000000" points="-0.149293694572,0.51065468293 0.148056879236,0.51065468293 0.141048258999,0.691178232679 -0.142285074335,0.691178232679"/>' +
                       '<polygon id="drF" fill="' + col("drF") + '" stroke="#000000" points="0.199293694572,0.51065468293 0.496644268381,0.51065468293 0.475618407668,0.691178232679 0.192285074335,0.691178232679"/>' +
                       '<polygon id="Ubl" fill="' + col("Ubl") + '" stroke="#000000" points="-0.475618407668,-0.691178232679 -0.192285074335,-0.691178232679 -0.199293694572,-0.51065468293 -0.496644268381,-0.51065468293"/>' +
                       '<polygon id="Ub" fill="' + col("Ub") + '" stroke="#000000" points="-0.141048258999,-0.691178232679 0.142285074335,-0.691178232679 0.149293694572,-0.51065468293 -0.148056879236,-0.51065468293"/>' +
                       '<polygon id="Urb" fill="' + col("Urb") + '" stroke="#000000" points="0.193521889671,-0.691178232679 0.476855223004,-0.691178232679 0.497881083717,-0.51065468293 0.200530509908,-0.51065468293"/>' +
                       '<polygon id="uL"  fill="' + (showLR ? col("uL") : 'transparent') + '" stroke="#000000" points="-0.62018227225,-0.477139502342 -0.551831698442,-0.477139502342 -0.575569881583,-0.278824338758 -0.647396821673,-0.277824338758"/>' +
                       '<polygon id="Ul" fill="' + col("Ul") + '" stroke="#000000" points="-0.49918227225,-0.477139502342 -0.201831698442,-0.477139502342 -0.209569881583,-0.277824338758 -0.522396821673,-0.277824338758"/>' +
                       '<polygon id="U" fill="' + col("U") + '" stroke="#000000" points="-0.147992506039,-0.477139502342 0.14935806777,-0.477139502342 0.15709625091,-0.277824338758 -0.15573068918,-0.277824338758"/>' +
                       '<polygon id="Ur" fill="' + col("Ur") + '" stroke="#000000" points="0.203197260173,-0.477139502342 0.500547833981,-0.477139502342 0.523762383403,-0.277824338758 0.210935443313,-0.277824338758"/>' +
                       '<polygon id="uR"  fill="' + (showLR ? col("uR") : 'transparent') + '" stroke="#000000" points="0.553197260173,-0.477139502342 0.623197260173,-0.477139502342 0.649935443313,-0.277824338758 0.577935443313,-0.277824338758"/>' +
                       '<polygon id="Ulf" fill="' + col("Ulf") + '" stroke="#000000" points="-0.525202921606,-0.240719878676 -0.212375981516,-0.240719878676 -0.220963898001,-0.0195178280008 -0.550966671063,-0.0195178280008"/>' +
                       '<polygon id="Uf" fill="' + col("Uf") + '" stroke="#000000" points="-0.155655712708,-0.240719878676 0.157171227382,-0.240719878676 0.165759143868,-0.0195178280008 -0.164243629194,-0.0195178280008"/>' +
                       '<polygon id="Ufr" fill="' + col("Ufr") + '" stroke="#000000" points="0.21389149619,-0.240719878676 0.52671843628,-0.240719878676 0.552482185737,-0.0195178280008 0.222479412675,-0.0195178280008"/>' +
                   '</g>' +
               '</svg>';
    }

    function diagramUFRAlg(rot, alg, kind, size, label) {
        var cube = Cube.alg(rot, Cube.solved);
        var simplified = Algs.kindToParams(kind).diagram.simplified;
        return diagramUFR(Cube.alg(alg, maskPieces(simplified, cube), true), true, size, label);
    }

    function diagramUFR(cube, simple, size, label) {
        var faces = Cube.faces(cube, simple);
        function col(face) {
            var col = faceColor(face, faces);
            if (simple) {
                return col;
            } else {
                return col;
            }
        }
        return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                   'width="' + (size || '100vmin') + '" height="' + (size || '100vmin') + '" viewBox="-0.9 -0.9 1.8 1.8">' +
                   '<rect fill="transparent" x="-0.9" y="-0.9" width="1.8" height="1.8"/>' +
                        '<g style="stroke-width:0.1;stroke-linejoin:round;opacity:1">' +
                            '<polygon fill="#000" stroke="#000" points="-4.9165444344952E-17,-0.71734170954349 0.70405037145575,-0.41272706360467 6.3108540577985E-17,-0.021725090572532 -0.70405037145575,-0.41272706360467"/>' +
                            '<polygon fill="#000" stroke="#000" points="6.3108540577985E-17,-0.021725090572532 0.70405037145575,-0.41272706360467 0.62948028357061,0.36901272915735 5.5589468959362E-17,0.81107056444244"/>' +
                            '<polygon fill="#000" stroke="#000" points="-0.70405037145575,-0.41272706360467 6.3108540577985E-17,-0.021725090572532 5.5589468959362E-17,0.81107056444244 -0.62948028357061,0.36901272915735"/>' +
                        '</g>' +
                        '<g style="opacity:1;stroke-opacity:0.5;stroke-width:0;stroke-linejoin:round">' +
                            '<polygon id="Ubl" fill="' + col("Ubl") + '" stroke="#000"  points="-4.9439549272153E-17,-0.74757064564692 0.19598754651203,-0.66277461469571 -1.6979580126642E-17,-0.57123720961754 -0.19598754651203,-0.66277461469571"/>' +
                            '<polygon id="Ub" fill="' + col("Ub") + '" stroke="#000"  points="0.23200530924361,-0.64654708450724 0.44357407294753,-0.55500967942906 0.24823152717746,-0.45589370157761 0.03601776273158,-0.55500967942906"/>' +
                            '<polygon id="Ubr" fill="' + col("Ubr") + '" stroke="#000"  points="0.48258385553552,-0.53743199405155 0.71166883865722,-0.4383160162001 0.51778341539206,-0.3306396536664 0.28724130976545,-0.43831601620009"/>' +
                            '<polygon id="Ul" fill="' + col("Ul") + '" stroke="#000"  points="-0.23200530924361,-0.64654708450724 -0.03601776273158,-0.55500967942906 -0.24823152717746,-0.45589370157761 -0.44357407294753,-0.55500967942906"/>' +
                            '<polygon id="U" fill="' + col("U") + '" stroke="#000"  points="-1.1906711768916E-17,-0.53743199405155 0.21221376444588,-0.43831601620009 1.3125827139793E-17,-0.3306396536664 -0.21221376444588,-0.43831601620009"/>' +
                            '<polygon id="Ur" fill="' + col("Ur") + '" stroke="#000"  points="0.25135344771691,-0.4192120352454 0.48189555334352,-0.31153567271171 0.27050899589682,-0.1941398664099 0.03913968327103,-0.31153567271171"/>' +
                            '<polygon id="Ufl" fill="' + col("Ufl") + '" stroke="#000"  points="-0.48258385553552,-0.53743199405155 -0.28724130976545,-0.43831601620009 -0.51778341539206,-0.3306396536664 -0.71166883865722,-0.43831601620009"/>' +
                            '<polygon id="Uf" fill="' + col("Uf") + '" stroke="#000"  points="-0.25135344771691,-0.4192120352454 -0.03913968327103,-0.31153567271171 -0.27050899589682,-0.1941398664099 -0.48189555334352,-0.31153567271171"/>' +
                            '<polygon id="Ufr" fill="' + col("Ufr") + '" stroke="#000"  points="1.9219742927126E-17,-0.29069716027551 0.23136931262579,-0.1733013539737 6.3251582941518E-17,-0.044807908897155 -0.23136931262579,-0.1733013539737"/>' +
                            '<polygon id="ufR" fill="' + col("ufR") + '" stroke="#000"  points="0.019572311898468,-0.01096266104553 0.25094162452426,-0.13945610612208 0.24139184674777,0.12672756322786 0.019572311898468,0.26171620101574"/>' +
                            '<polygon id="uR" fill="' + col("uR") + '" stroke="#000"  points="0.28930534489087,-0.16171652284677 0.50069190233757,-0.27911232914857 0.48317508531013,-0.019324131300046 0.27975556711438,0.10446714650317"/>' +
                            '<polygon id="ubR" fill="' + col("ubR") + '" stroke="#000"  points="0.53586287162127,-0.29952357725519 0.72974829488643,-0.40719993978888 0.70556381569579,-0.15366705164652 0.51834605459384,-0.039735379406663"/>' +
                            '<polygon id="fR" fill="' + col("fR") + '" stroke="#000"  points="0.018796486168384,0.30740091161998 0.24061602101769,0.1724122738321 0.23182332941007,0.41749346528561 0.018796486168384,0.55752511994163"/>' +
                            '<polygon id="R" fill="' + col("R") + '" stroke="#000"  points="0.27748498154717,0.14913168479738 0.48090449974292,0.025340406994164 0.46472097442439,0.26535483831193 0.26869228993956,0.39421287625089"/>' +
                            '<polygon id="bR" fill="' + col("bR") + '" stroke="#000"  points="0.51482272047627,0.0039202514920256 0.70204048157822,-0.11001142074783 0.6796261786066,0.12496419825545 0.49863919515774,0.24393468280979"/>' +
                            '<polygon id="dfR" fill="' + col("dfR") + '" stroke="#000"  points="0.018079821190449,0.59957070958542 0.23110666443214,0.4595390549294 0.22298446134887,0.68593152923737 0.018079821190449,0.82982754001392"/>' +
                            '<polygon id="dR" fill="' + col("dR") + '" stroke="#000"  points="0.26659321028119,0.43546258559693 0.46262189476603,0.30660454765797 0.44762501691219,0.52902006212629 0.25847100719792,0.6618550599049"/>' +
                            '<polygon id="dbR" fill="' + col("dbR") + '" stroke="#000"  points="0.49537315323635,0.28438159074811 0.67636013668521,0.16541110619376 0.65552852022793,0.38379496484358 0.4803762753825,0.50679710521643"/>' +
                            '<polygon id="uFl" fill="' + col("uFl") + '" stroke="#000"  points="-0.73033661801848,-0.40664800069716 -0.53645119475332,-0.29897163816347 -0.51893437772588,-0.039183440314942 -0.70615213882784,-0.1531151125548"/>' +
                            '<polygon id="uF" fill="' + col("uF") + '" stroke="#000"  points="-0.50139487638912,-0.27854802283962 -0.29000831894242,-0.16115221653782 -0.28045854116593,0.10503145281212 -0.48387805936169,-0.018759824991097"/>' +
                            '<polygon id="uFr" fill="' + col("uFr") + '" stroke="#000"  points="-0.25178425197513,-0.13888300088285 -0.020414939349334,-0.010389555806295 -0.020414939349334,0.26228930625497 -0.24223447419864,0.12730066846709"/>' +
                            '<polygon id="Fl" fill="' + col("Fl") + '" stroke="#000"  points="-0.70259025607703,-0.10956681966126 -0.51537249497507,0.0043648525785978 -0.49918896965654,0.24437928389636 -0.68017595310541,0.12540879934202"/>' +
                            '<polygon id="F" fill="' + col("F") + '" stroke="#000"  points="-0.48155663212918,0.025787474064964 -0.27813711393343,0.14957875186818 -0.26934442232581,0.39465994332169 -0.46537310681065,0.26580190538273"/>' +
                            '<polygon id="Fr" fill="' + col("Fr") + '" stroke="#000"  points="-0.24139184674777,0.17285724590871 -0.019572311898468,0.30784588369658 -0.019572311898468,0.55797009201823 -0.23259915514016,0.41793843736221"/>' +
                            '<polygon id="dFl" fill="' + col("dFl") + '" stroke="#000"  points="-0.67687496656198,0.16576684053069 -0.49588798311312,0.28473732508503 -0.48089110525928,0.50715283955335 -0.6560433501047,0.38415069918051"/>' +
                            '<polygon id="dF" fill="' + col("dF") + '" stroke="#000"  points="-0.46322848371637,0.30695545587912 -0.26719979923154,0.43581349381808 -0.25907759614827,0.66220596812605 -0.44823160586253,0.52937097034744"/>' +
                            '<polygon id="dFr" fill="' + col("dFr") + '" stroke="#000"  points="-0.23182332941007,0.45988002752827 -0.018796486168384,0.59991168218429 -0.018796486168384,0.83016851261279 -0.2237011263268,0.68627250183624"/>' +
                            '<text fill="red" font-size="0.5" dy="0.05" dominant-baseline="middle" text-anchor="middle"" style="stroke:#000000; stroke-width:0.15em; stroke-opacity:1">' + label.toUpperCase() + '</text>' +
                            '<text fill="white" font-size="0.5" dy="0.05" dominant-baseline="middle" text-anchor="middle"">' + label.toUpperCase() + '</text>' +
                        '</g>' +
                     '</svg>';
    }

    return {
        maskPieces: maskPieces,
        diagram: diagram,
        diagramAlg: diagramAlg,
        faceToCssColor: faceToCssColor
    };
}());
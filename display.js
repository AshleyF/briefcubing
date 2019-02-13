/*
Roofpig integration
Assumes an element with ID of "cube" in which to render.
*/
var Display = (function () {
    var corners = ["UBL", "ULF", "UFR", "URB", "DLB", "DFL", "DRF", "DBR"]
    var edges = ["UB", "UL", "UF", "UR", "BL", "FL", "FR", "BR", "DB", "DL", "DF", "DR"];

    function faceToCssColor(face) {
        switch (face) {
            case 'U': return Settings.values.colorSchemeU || "#EF0";
            case 'D': return Settings.values.colorSchemeD || "#FFF";
            case 'L': return Settings.values.colorSchemeL || "#08F";
            case 'R': return Settings.values.colorSchemeR || "#0C0";
            case 'F': return Settings.values.colorSchemeF || "#F10";
            case 'B': return Settings.values.colorSchemeB || "#F90";
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

    const gray = "#222";
    const purple = "#B4F";

    function faceColor(face, faces) {
        return faceToCssColor(Cube.faceColor(face, faces));
    }

    function diagram(cube, diag, id, simple, size) {
        switch (diag.type) {
            case "top": return diagramLL(Cube.faces(cube), diag, simple, size);
            case "top-front": return diagramTF(cube, diag, simple, false, size);
            case "top-front-ul-ur": return diagramTF(cube, diag, simple, true, size);
            case "bld": return diagramBLD(id, size);
            default: throw "Unknown diagram type: " + diag.type;
        }
    }

    function diagramAlg(rot, alg, size) {
        var diag = Algs.kindToParams(alg.kind).diagram;
        switch (diag.type) {
            case "top": return diagramLLAlg(rot, alg.alg, diag, size);
            case "top-front": return diagramTFAlg(rot, alg.alg, diag, size);
            case "top-front-ul-ur": return diagramTFULURAlg(rot, alg.alg, diag, size);
            case "bld": return diagramBLD(alg.id, size);
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
        return diagramLL(Cube.faces(Cube.alg(alg, Cube.alg(rot, Cube.solved), true)), diag, true, size);
    }

    function diagramLL(faces, diag, simple, size) {
        function col(face) {
            var col = faceColor(face, faces);
            if (simple) {
                var len = face.length;
                if (diag.simplified.hideUCenter && len == 1) {
                    var upcols = Settings.values.upColors;
                    var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                    return numColors > 1 ? col : gray;
                }
                else if (diag.simplified.hideEdges && len == 2) {
                    return diag.simplified.showEdgeU && face.indexOf('U') != -1 ? col : gray;
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

    function diagramTFAlg(rot, alg, diag, size) {
        return diagramTF(Cube.alg(alg, Cube.alg(rot, Cube.solved), true), diag, true, false, size);
    }

    function diagramTFULURAlg(rot, alg, diag, size) {
        return diagramTF(Cube.alg("U' " + alg, Cube.alg(rot, Cube.solved), true), diag, true, true, size);
    }

    function diagramTF(cube, diag, simple, showLR, size) {
        function edgeIsFlipped(edge, faces, u, d) {
            if (edge[0] == "U" || edge[0] == "D") { // only U/D edges
                udEdge = edge[0] + edge[1].toLowerCase();
                var c = Cube.faceColor(udEdge, faces);
                return c != u && c != d;
            }
            return false;
        }
        var faces = Cube.faces(cube);
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

    return {
        diagram: diagram,
        diagramAlg: diagramAlg,
        faceToCssColor: faceToCssColor
    };
}());
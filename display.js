/*
Roofpig integration
Assumes an element with ID of "cube" in which to render.
*/
var Display = (function () {
    var corners = ["UBL", "ULF", "UFR", "URB", "DLB", "DFL", "DRF", "DBR"]
    var edges = ["UB", "UL", "UF", "UR", "BL", "FL", "FR", "BR", "DB", "DL", "DF", "DR"];

    function faceToCssColor(face) {
        switch (face) {
            case 'U': return "#EF0";
            case 'D': return "#FFF";
            case 'L': return "#08F";
            case 'R': return "#0C0";
            case 'F': return "#F10";
            case 'B': return "#F90";
            // case 'P': return "#B4F";
            // case '*': return "#000";
            // default: return "#333";
        }
    }

    function display3DCube(faces, target) {
        function render(config) {
            document.getElementById(target).innerHTML = "";
            CubeAnimation.create_in_dom("#cube", config, "class='roofpig'");
        }
        var colors = "|colors=U:" + faceToCssColor('U') + " D:" + faceToCssColor('D') + " L:" + faceToCssColor('L') + " R:" + faceToCssColor('R') + " F:" + faceToCssColor('F') + " B:" + faceToCssColor('B');
        var pov = "|pov=" + faces.U + faces.F.toLowerCase() + faces.R.toLowerCase();
        var tweaks = "flags=canvas|hover=3|solved=*" + colors + pov + "|tweaks=U:U D:D L:L R:R F:F B:B ";
        for(f in faces) {
            if (f.length > 1) { // excluding "U", "D", "L", "R", "F", "B"
                tweaks += faces[f] + ':' + f + ' ';
            }
        }
        render(tweaks);
    }

    function faceColor(face, faces) {
        return faceToCssColor(Cube.faceColor(face, faces));
    }

    function displayLL(faces, target) {
        document.getElementById(target).innerHTML =
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                'width="100%" height="100%"' +
                'viewBox="-0.9 -0.9 1.8 1.8">' +
                '<rect fill="transparent" x="-0.9" y="-0.9" width="1.8" height="1.8"/>' +
                '<g style="stroke-width:0.1;stroke-linejoin:round;opacity:1">' +
                    '<polygon fill="#000000" stroke="#000000" points="-0.522222222222,-0.522222222222 0.522222222222,-0.522222222222 0.522222222222,0.522222222222 -0.522222222222,0.522222222222"/>' +
                '</g>' +
                '<g style="opacity:1;stroke-opacity:0.5;stroke-width:0;stroke-linejoin:round">' +
                    '<polygon id="Ubl" fill="' + faceColor("Ubl", faces) + '" stroke="#000000" points="-0.527777777778,-0.527777777778 -0.212962962963,-0.527777777778 -0.212962962963,-0.212962962963 -0.527777777778,-0.212962962963"/>' +
                    '<polygon id="Ub" fill="' + faceColor("Ub", faces) + '" stroke="#000000" points="-0.157407407407,-0.527777777778 0.157407407407,-0.527777777778 0.157407407407,-0.212962962963 -0.157407407407,-0.212962962963"/>' +
                    '<polygon id="Urb" fill="' + faceColor("Urb", faces) + '" stroke="#000000" points="0.212962962963,-0.527777777778 0.527777777778,-0.527777777778 0.527777777778,-0.212962962963 0.212962962963,-0.212962962963"/>' +
                    '<polygon id="Ul" fill="' + faceColor("Ul", faces) + '" stroke="#000000" points="-0.527777777778,-0.157407407407 -0.212962962963,-0.157407407407 -0.212962962963,0.157407407407 -0.527777777778,0.157407407407"/>' +
                    '<polygon id="U" fill="' + faceColor("U", faces) + '" stroke="#000000" points="-0.157407407407,-0.157407407407 0.157407407407,-0.157407407407 0.157407407407,0.157407407407 -0.157407407407,0.157407407407"/>' +
                    '<polygon id="Ur" fill="' + faceColor("Ur", faces) + '" stroke="#000000" points="0.212962962963,-0.157407407407 0.527777777778,-0.157407407407 0.527777777778,0.157407407407 0.212962962963,0.157407407407"/>' +
                    '<polygon id="Ulf" fill="' + faceColor("Ulf", faces) + '" stroke="#000000" points="-0.527777777778,0.212962962963 -0.212962962963,0.212962962963 -0.212962962963,0.527777777778 -0.527777777778,0.527777777778"/>' +
                    '<polygon id="Uf" fill="' + faceColor("Uf", faces) + '" stroke="#000000" points="-0.157407407407,0.212962962963 0.157407407407,0.212962962963 0.157407407407,0.527777777778 -0.157407407407,0.527777777778"/>' +
                    '<polygon id="Ufr" fill="' + faceColor("Ufr", faces) + '" stroke="#000000" points="0.212962962963,0.212962962963 0.527777777778,0.212962962963 0.527777777778,0.527777777778 0.212962962963,0.527777777778"/>' +
                '</g>' +
                '<g style="opacity:1;stroke-opacity:1;stroke-width:0.02;stroke-linejoin:round">' +
                    '<polygon id="uBl" fill="' + faceColor("uBl", faces) + '" stroke="#000000" points="-0.195146871009,-0.554406130268 -0.543295019157,-0.554406130268 -0.507279693487,-0.718390804598 -0.183141762452,-0.718390804598"/>' +
                    '<polygon id="uB" fill="' + faceColor("uB", faces) + '" stroke="#000000" points="0.174457215837,-0.554406130268 -0.173690932312,-0.554406130268 -0.161685823755,-0.718390804598 0.16245210728,-0.718390804598"/>' +
                    '<polygon id="urB" fill="' + faceColor("urB", faces) + '" stroke="#000000" points="0.544061302682,-0.554406130268 0.195913154534,-0.554406130268 0.183908045977,-0.718390804598 0.508045977011,-0.718390804598"/>' +
                    '<polygon id="ubL" fill="' + faceColor("ubL", faces) + '" stroke="#000000" points="-0.554406130268,-0.544061302682 -0.554406130268,-0.195913154534 -0.718390804598,-0.183908045977 -0.718390804598,-0.508045977011"/>' +
                    '<polygon id="uL" fill="' + faceColor("uL", faces) + '" stroke="#000000" points="-0.554406130268,-0.174457215837 -0.554406130268,0.173690932312 -0.718390804598,0.161685823755 -0.718390804598,-0.16245210728"/>' +
                    '<polygon id="uLf" fill="' + faceColor("uLf", faces) + '" stroke="#000000" points="-0.554406130268,0.195146871009 -0.554406130268,0.543295019157 -0.718390804598,0.507279693487 -0.718390804598,0.183141762452"/>' +
                    '<polygon id="uRb" fill="' + faceColor("uRb", faces) + '" stroke="#000000" points="0.554406130268,-0.195146871009 0.554406130268,-0.543295019157 0.718390804598,-0.507279693487 0.718390804598,-0.183141762452"/>' +
                    '<polygon id="uR" fill="' + faceColor("uR", faces) + '" stroke="#000000" points="0.554406130268,0.174457215837 0.554406130268,-0.173690932312 0.718390804598,-0.161685823755 0.718390804598,0.16245210728"/>' +
                    '<polygon id="ufR" fill="' + faceColor("ufR", faces) + '" stroke="#000000" points="0.554406130268,0.544061302682 0.554406130268,0.195913154534 0.718390804598,0.183908045977 0.718390804598,0.508045977011"/>' +
                    '<polygon id="ulF" fill="' + faceColor("ulF", faces) + '" stroke="#000000" points="-0.544061302682,0.554406130268 -0.195913154534,0.554406130268 -0.183908045977,0.718390804598 -0.508045977011,0.718390804598"/>' +
                    '<polygon id="uF" fill="' + faceColor("uF", faces) + '" stroke="#000000" points="-0.174457215837,0.554406130268 0.173690932312,0.554406130268 0.161685823755,0.718390804598 -0.16245210728,0.718390804598"/>' +
                    '<polygon id="uFr" fill="' + faceColor("uFr", faces) + '" stroke="#000000" points="0.195146871009,0.554406130268 0.543295019157,0.554406130268 0.507279693487,0.718390804598 0.183141762452,0.718390804598"/>' +
                '</g>' +
            '</svg>';
    }

    function displayUF(faces, target) {
        document.getElementById(target).innerHTML =
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                'width="100%" height="100%"' +
                'viewBox="-0.9 -0.9 1.8 1.8">' +
                '<rect fill="transparent" x="-0.9" y="-0.9" width="1.8" height="1.8"/>' +
                '<g style="stroke-width:0.1;stroke-linejoin:round;opacity:1">' +
                    '<polygon fill="#000" stroke="#000000" points="-0.547416364726,6.07754252175E-17 0.547416364726,6.07754252175E-17 0.47,0.664680374315 -0.47,0.664680374315"/>' +
                    '<polygon fill="#000" stroke="#000000" points="-0.47,-0.664680374315 0.47,-0.664680374315 0.547416364726,6.07754252175E-17 -0.547416364726,6.07754252175E-17"/>' +
                '</g>' +
                '<g style="opacity:1;stroke-opacity:0.5;stroke-width:0;stroke-linejoin:round">' +
                    '<polygon id="ulF" fill="' + faceColor("ulF", faces) + '" stroke="#000000" points="-0.552482185737,0.0195178280008 -0.222479412675,0.0195178280008 -0.21389149619,0.240719878676 -0.52671843628,0.240719878676"/>' +
                    '<polygon id="uF" fill="' + faceColor("uF", faces) + '" stroke="#000000" points="-0.165759143868,0.0195178280008 0.164243629194,0.0195178280008 0.155655712708,0.240719878676 -0.157171227382,0.240719878676"/>' +
                    '<polygon id="uFr" fill="' + faceColor("uFr", faces) + '" stroke="#000000" points="0.220963898001,0.0195178280008 0.550966671063,0.0195178280008 0.525202921606,0.240719878676 0.212375981516,0.240719878676"/>' +
                    '<polygon id="Fl" fill="' + faceColor("Fl", faces) + '" stroke="#000000" points="-0.523762383403,0.277824338758 -0.210935443313,0.277824338758 -0.203197260173,0.477139502342 -0.500547833981,0.477139502342"/>' +
                    '<polygon id="F" fill="' + faceColor("F", faces) + '" stroke="#000000" points="-0.15709625091,0.277824338758 0.15573068918,0.277824338758 0.147992506039,0.477139502342 -0.14935806777,0.477139502342"/>' +
                    '<polygon id="Fr" fill="' + faceColor("Fr", faces) + '" stroke="#000000" points="0.209569881583,0.277824338758 0.522396821673,0.277824338758 0.49918227225,0.477139502342 0.201831698442,0.477139502342"/>' +
                    '<polygon id="dFl" fill="' + faceColor("dFl", faces) + '" stroke="#000000" points="-0.497881083717,0.51065468293 -0.200530509908,0.51065468293 -0.193521889671,0.691178232679 -0.476855223004,0.691178232679"/>' +
                    '<polygon id="dF" fill="' + faceColor("dF", faces) + '" stroke="#000000" points="-0.149293694572,0.51065468293 0.148056879236,0.51065468293 0.141048258999,0.691178232679 -0.142285074335,0.691178232679"/>' +
                    '<polygon id="drF" fill="' + faceColor("drF", faces) + '" stroke="#000000" points="0.199293694572,0.51065468293 0.496644268381,0.51065468293 0.475618407668,0.691178232679 0.192285074335,0.691178232679"/>' +
                    '<polygon id="Ubl" fill="' + faceColor("Ubl", faces) + '" stroke="#000000" points="-0.475618407668,-0.691178232679 -0.192285074335,-0.691178232679 -0.199293694572,-0.51065468293 -0.496644268381,-0.51065468293"/>' +
                    '<polygon id="Ub" fill="' + faceColor("Ub", faces) + '" stroke="#000000" points="-0.141048258999,-0.691178232679 0.142285074335,-0.691178232679 0.149293694572,-0.51065468293 -0.148056879236,-0.51065468293"/>' +
                    '<polygon id="Urb" fill="' + faceColor("Urb", faces) + '" stroke="#000000" points="0.193521889671,-0.691178232679 0.476855223004,-0.691178232679 0.497881083717,-0.51065468293 0.200530509908,-0.51065468293"/>' +
                    '<polygon id="uL"  fill="' + faceColor("uL", faces) + '" stroke="#000000" points="-0.60018227225,-0.477139502342 -0.551831698442,-0.477139502342 -0.575569881583,-0.278824338758 -0.627396821673,-0.277824338758"/>' +
                    '<polygon id="Ul" fill="' + faceColor("Ul", faces) + '" stroke="#000000" points="-0.49918227225,-0.477139502342 -0.201831698442,-0.477139502342 -0.209569881583,-0.277824338758 -0.522396821673,-0.277824338758"/>' +
                    '<polygon id="U" fill="' + faceColor("U", faces) + '" stroke="#000000" points="-0.147992506039,-0.477139502342 0.14935806777,-0.477139502342 0.15709625091,-0.277824338758 -0.15573068918,-0.277824338758"/>' +
                    '<polygon id="Ur" fill="' + faceColor("Ur", faces) + '" stroke="#000000" points="0.203197260173,-0.477139502342 0.500547833981,-0.477139502342 0.523762383403,-0.277824338758 0.210935443313,-0.277824338758"/>' +
                    '<polygon id="uR"  fill="' + faceColor("uR", faces) + '" stroke="#000000" points="0.553197260173,-0.477139502342 0.603197260173,-0.477139502342 0.629935443313,-0.277824338758 0.577935443313,-0.277824338758"/>' +
                    '<polygon id="Ulf" fill="' + faceColor("Ulf", faces) + '" stroke="#000000" points="-0.525202921606,-0.240719878676 -0.212375981516,-0.240719878676 -0.220963898001,-0.0195178280008 -0.550966671063,-0.0195178280008"/>' +
                    '<polygon id="Uf" fill="' + faceColor("Uf", faces) + '" stroke="#000000" points="-0.155655712708,-0.240719878676 0.157171227382,-0.240719878676 0.165759143868,-0.0195178280008 -0.164243629194,-0.0195178280008"/>' +
                    '<polygon id="Ufr" fill="' + faceColor("Ufr", faces) + '" stroke="#000000" points="0.21389149619,-0.240719878676 0.52671843628,-0.240719878676 0.552482185737,-0.0195178280008 0.222479412675,-0.0195178280008"/>' +
                '</g>' +
            '</svg>';
    }

    return {
        display3DCube: display3DCube,
        displayLL: displayLL,
        displayUF: displayUF
    };
}());
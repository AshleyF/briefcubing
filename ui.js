var Ui = (function () {
    function displayAlg(alg) {
        var cube = Cube.alg(alg, Cube.solved);
        document.getElementById("debug").innerText = Cube.toString(cube);
        function delay() {
            Display.display3DCube(Cube.faces(cube), "cube");
            Display.displayLL(Cube.faces(cube), "ll");
            Display.displayUF(Cube.faces(cube), "uf");
        }
        window.setTimeout(delay, 1);
    }

    var timer;
    function checkProgress() {
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(function () { if (lastStatus == "progress") setStatus("incorrect"); }, 3000);
    }

    var lastStatus = "init";
    var waiting = false;

    var incorrect = new Audio("incorrect.wav");
    incorrect.load();
    var correct = new Audio("correct.wav");
    correct.load();

    function setStatus(status) {
        lastStatus = status;
        switch (status) {
            case "correct":
                correct.play();
                document.body.style.backgroundColor = "green";
                document.getElementById("retry").disabled = false;
                document.getElementById("next").disabled = false;
                window.setTimeout(function () { if (lastStatus == "correct") waiting = true; }, 500);
                break;
            case "incorrect":
                incorrect.play();
                document.body.style.backgroundColor = "darkred";
                document.getElementById("retry").disabled = false;
                document.getElementById("next").disabled = false;
                window.setTimeout(function () { if (lastStatus == "incorrect") waiting = true; }, 500);
                break;
            case "progress":
                document.body.style.backgroundColor = "#333";
                document.getElementById("retry").disabled = false;
                document.getElementById("next").disabled = false;
                waiting = false;
                checkProgress();
                break;
            case "init":
                document.getElementById("status").innerHTML = "&nbsp;";
                document.body.style.backgroundColor = "black";
                document.getElementById("retry").disabled = true;
                document.getElementById("next").disabled = false;
                waiting = false;
                break;
            case "error":
                document.getElementById("status").innerHTML = "&nbsp;";
                document.body.style.backgroundColor = "black";
                document.getElementById("retry").disabled = true;
                document.getElementById("next").disabled = true;
                waiting = false;
                break;
        }
    }

    function verify(result) {
        switch (kind) {
            case "ocll":
                var pat;
                switch (Ui.settings.method) {
                    case "cfop":
                        pat = "U.U...U.U...LLLLLL...FFFFFF...RRRRRRDDDDDDDDDBBBBBB..."; // whole first two layers
                        break;
                    case "roux":
                        pat = "U.U...U.U...LLLLLL...F.FF.F...RRRRRRD.DD.DD.DB.BB.B..."; // M-slice free
                        break;
                    default: throw "Unknown method: " + Ui.settings.method;
                }
                return Cube.matchPattern(pat, result);
            case "cmll":
            case "pcll":
                var pat;
                switch (Ui.settings.method) {
                    case "cfop":
                        pat = "U.U...U.UL.LLLLLLLF.FFFFFFFR.RRRRRRRDDDDDDDDDBBBBBBB.B"; // whole first two layers
                        break;
                    case "roux":
                        pat = "U.U...U.UL.LLLLLLLF.FF.FF.FR.RRRRRRRD.DD.DD.DB.BB.BB.B"; // M-slice free
                        break;
                    default: throw "Unknown method: " + Ui.settings.method;
                }
                if (Cube.matchPattern(pat, result)) return true;
                if (Cube.matchPattern(pat, Cube.alg("U", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U'", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U2", result))) return true;
                if (Ui.settings.method == "roux") {
                    // try flipping M-slice too because some algs (with wide moves) flip this
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U2", result))) return true;
                }
                return false;
        }
    }

    function twist(t) {
        if (waiting) {
            // retry/next with X/X'
            if (t.endsWith("'")) retry(); else next();
            return;
        }
        function check() {
            var rotations = ["", "x", "x y", "x y'", "x y2", "x z", "x z'", "x z2", "x'", "x' y", "x' y'", "x' z", "x' z'", "x2", "x2 y", "x2 y'", "x2 z", "x2 z'", "y", "y'", "y2", "z", "z'", "z2"];
            for (var i = 0; i < rotations.length; i++) {
                var rot = rotations[i];
                // apply rotation, alg, inverse rotation
                var result = Cube.alg(rot, Cube.alg(alg, Cube.alg(rot, instance)), true);
                if (verify(result)) {
                    setStatus("correct");
                    return true;
                }
            }
        }
        if (t == "") return;
        alg += t + ' ';
        var len = alg.split(' ').length;
        var progress = "";
        for (var i = 1; i < len; i++) {
            progress += "&bull; ";
        }
        document.getElementById("status").innerHTML = progress;
        setStatus("progress");
        check();
    }

    function connected() {
        var btn = document.getElementById("giiker");
        btn.disabled = false;
        btn.innerText = "Disconnect";
    }

    function disconnect() {
        var btn = document.getElementById("giiker");
        btn.disabled = false;
        btn.innerText = "Connect";
        Giiker.disconnect();
    }

    function error(ex) {
        var btn = document.getElementById("giiker");
        btn.disabled = false;
        btn.innerText = "Connect";
        alert("Error: " + ex.message);
    }

    function giiker() {
        var btn = document.getElementById("giiker");
        if (Giiker.connected()) {
            btn.disabled = false;
            btn.innerText = "Connect";
            Giiker.disconnect();
        } else {
            btn.disabled = true;
            btn.innerText = "Connecting...";
            Giiker.connect(connected, twist, error);
        }
    }

    var settings = {};
    var instance = Cube.solved;
    var alg = "";
    var solution = "";
    var kind;

    function next() {
        function randomElement(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
        function challenge(cas) {
            kind = cas.kind;
            var auf = settings.auf ? randomElement(["", "U ", "U' ", "U2 "]) : "";
            solution = auf + cas.alg;
            instance = Cube.solved;
            // up color
            var rot = [];
            if (settings.yellow) rot.push("");
            if (settings.white) rot.push("x2");
            if (settings.red) rot.push("x");
            if (settings.orange) rot.push("x'");
            if (settings.green) rot.push("z'");
            if (settings.blue) rot.push("z");
            instance = Cube.random(rot, 1, instance);
            instance = Cube.random(["", "y", "y'", "y2"], 1, instance); // random orientation around y-axis
            var upColor = Cube.faceColor("U", Cube.faces(instance));
            switch (settings.method) {
                case "cfop": break; // nothing extra
                case "roux":
                    // scramble M-slice with U-layer
                    instance = Cube.random(["U", "U'", "U2", "M", "M'", "M2"], 100, instance);
                    break;
                default: throw "Unknown method: " + Ui.settings.method;
                
            }
            switch (kind) {
                case "cmll": break; // nothing extra
                case "ocll":
                    // scramble corners and edges
                    var jperm_b = "R U R' F' R U R' U' R' F R2 U' R' U'";
                    var yperm = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
                    for (var i = 0; i < 10; i++) {
                        instance = Cube.random(["", "U", "U'", "U2"], 1, instance);
                        instance = Cube.random([jperm_b, yperm], 1, instance);
                    }
                    break;
                case "pcll": break; // nothing extra
                default: throw "Unknown alg kind: " + kind;
            }
            // apply solution
            instance = Cube.alg(solution, instance, true);
            switch (settings.method) {
                case "cfop": break; // nothing extra
                case "roux":
                    var numColors = (settings.yellow ? 1 : 0) + (settings.white ? 1 : 0) + (settings.red ? 1 : 0) + (settings.orange ? 1 : 0) + (settings.green ? 1 : 0) + (settings.blue ? 1 : 0);
                    if (numColors > 1) {
                        switch (kind) {
                            case "cmll":
                            case "ocll":
                                // adjust M-slice so center top indicates color (too confusing otherwise!)
                                while (Cube.faceColor("U", Cube.faces(instance)) != upColor) {
                                    instance = Cube.alg("M", instance);
                                }
                                break;
                            case "pcll": break; // nothing extra
                            default: throw "Unknown alg kind: " + kind;
                        }
                    }
                    break;
                default: throw "Unknown method: " + Ui.settings.method;
            }
        }
        alg = "";
        if (settings.cases.length > 0) {
            challenge(randomElement(settings.cases));
            setStatus("init");
        } else {
            instance = Cube.solved;
            setStatus("error");
        }
        update(instance);
    }

    function retry() {
        alg = "";
        update(instance);
        setStatus("init");
    }

    return {
        displayAlg: displayAlg,
        twist: twist,
        giiker: giiker,
        next: next,
        retry: retry,
        settings: settings
    };
}());
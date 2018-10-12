    var Ui = (function () {
        var timer;
        function checkProgress() {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(function () { if (lastStatus == "progress") setStatus("incorrect"); }, 3000);
        }

        var lastStatus = "init";
        var waiting = false;
        var partial = null;
        var initiallyPartial = false;

        var incorrect = new Audio("incorrect.wav");
        incorrect.load();
        var correct = new Audio("correct.wav");
        correct.load();

        var recognitionStart = null;
        var executionStart = null;
        var executionStop = null;

        function renderTimer() {
            function renderSpan(span) {
                var ms = span % 1000;
                span = (span - ms) / 1000;
                var s = span % 60;
                span = (span - s) / 60;
                var m = span % 60;
                span = (span - m) / 60;
                var h = span % 60;
                return (h > 0 ? h + ':' : '') + 
                       (m > 0 ? (h > 0 && m < 10 ? '0' : '') + m + ':' : '') +
                       (m > 0 && s < 10 ? '0' : '') + s + '.' +
                       (ms < 100 ? '0' : '') + (ms < 10 ? '0' : '') + ms;
            }
            var now = new Date();
            var reco = recognitionStart ? (executionStart || now) - recognitionStart : 0;
            var exec = executionStart ? (executionStop || now) - executionStart : 0;
            var htm = '<table style="margin-left:auto;margin-right:auto">';
            htm += '<tr><td align="right">' + Localization.getString("recognitionTime") + ':</td><td>' + renderSpan(reco) + '</td></tr>';
            htm += '<tr><td align="right">' + Localization.getString("executionTime") + ':</td><td>' + renderSpan(exec) + '</td></tr>';
            htm += '<tr><td align="right"></td><td style="font-weight: bold; border-top: 1px solid white">' + renderSpan(reco + exec) + '</td></tr>';
            htm += '</table>';
            document.getElementById("message").innerHTML = htm;
        }

        function startRecognition() {
            recognitionStart = new Date();
            executionStart = null;
            executionStop = null;
        }

        function startOrContinueExecution() {
            if (!executionStart)  executionStart = new Date();
        }

        function stopExecution() {
            executionStop = new Date();
        }

        function setStatus(status) {
            lastStatus = status;
            switch (status) {
                case "correct":
                    stopExecution();
                    renderTimer();
                    correct.play();
                    document.getElementById("diagram").style.backgroundColor = "green";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    window.setTimeout(function () { if (lastStatus == "correct") waiting = true; }, 500);
                    partial = null;
                    initiallyPartial = false;
                    $("#popup").popup("close");
                    break;
                case "partial":
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "goldenrod";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    break;
                case "incorrect":
                    stopExecution();
                    incorrect.play();
                    document.getElementById("diagram").style.backgroundColor = "darkred";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    window.setTimeout(function () { if (lastStatus == "incorrect") waiting = true; }, 500);
                    partial = null;
                    initiallyPartial = false;
                    break;
                case "progress":
                    startOrContinueExecution();
                    document.getElementById("diagram").style.backgroundColor = (partial ? "goldenrod" : "#444");
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    checkProgress();
                    break;
                case "init":
                    startRecognition();
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "transparent";
                    document.getElementById("retry").disabled = true;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    partial = null;
                    initiallyPartial = verifyPartial(instance);
                    document.getElementById("message").innerHTML = '<br /><br /><a href="#popup" data-rel="popup" data-transition="pop" style="font-size: small; margin-left: 0.5em">' + Localization.getString("hint") + '</a>';
                    break;
                case "error":
                    stopExecution();
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "transparent";
                    document.getElementById("retry").disabled = true;
                    document.getElementById("next").disabled = true;
                    waiting = false;
                    document.getElementById("message").innerText = ""; // remove "Hint" link
                    break;
            }
        }

        function verifyPartial(result) {
            // check partial match (corners oriented, but not permuted)
            var pat;
            switch (kind) {
                case "cmll":
                    pat = "U.U...U.U...LLLLLL...F.FF.F...RRRRRRD.DD.DD.DB.BB.B..."; // M-slice free
                    break;
                case "oll":
                case "pll":
                case "coll":
                    pat = "U.U...U.U...LLLLLL...FFFFFF...RRRRRRDDDDDDDDDBBBBBB..."; // whole first two layers
                    break;
                case "eo":
                case "eolr":
                    return false; // not possible
                default: throw "Unknown kind type: " + kind;
            }
            return Cube.matchPattern(pat, result);
        }

        function verifyComplete(result) {
            function checkEO() {
                // check that edges are oriented
                return true; // TODO
            }
            function checkLR() {
                // UL/UR edges should be in DF/DB position
                return true; // TODO
            }
            function matchWithAdjustments(pat) {
                if (Cube.matchPattern(pat, result)) return true;
                if (Cube.matchPattern(pat, Cube.alg("U", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U'", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U2", result))) return true;
                if (kind == "cmll") {
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
            }
            const cmllPattern = "U.U...U.UL.LLLLLLLF.FF.FF.FR.RRRRRRRD.DD.DD.DB.BB.BB.B";
            switch (kind) {
                case "cmll": return matchWithAdjustments(cmllPattern); // M-slice free
                case "oll": return matchWithAdjustments("UUUUUUUUUL.LLLLLLLF.FFFFFFFR.RRRRRRRDDDDDDDDDBBBBBBB.B"); // all oriented + whole first two layers
                case "pll": return matchWithAdjustments("UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRDDDDDDDDDBBBBBBBBB"); // all oriented + whole first two layers
                case "coll": return matchWithAdjustments("U.U...U.UL.LLLLLLLF.FFFFFFFR.RRRRRRRDDDDDDDDDBBBBBBB.B"); // whole first two layers
                case "eo": return matchWithAdjustments(cmllPattern) && checkEO();
                case "eolr": return matchWithAdjustments(cmllPattern) && checkEO() && checkLR();
                default: throw "Unknown kind type: " + kind;
            }
        }

        function verify(result, includePartial) {
            if (verifyComplete(result)) {
                update(result);
                setStatus("correct");
                return true;
            }
            if (includePartial && !partial && !initiallyPartial && verifyPartial(result)) {
                partial = instance; // record for retry
                instance = result;
                update(instance);
                alg = "";
                setStatus("partial");
            }
            return false;
        }

        var queued = 0; // count of queued check() calls
        function twist(t) {
            if (waiting) {
                // retry/next with X/X'
                if (t.endsWith("'")) retry(); else next();
                return;
            }
            function check() {
                if (--queued > 0) return; // skip checking - let future queued calls get to it
                var rotations = ["", "x", "x y", "x y'", "x y2", "x z", "x z'", "x z2", "x'", "x' y", "x' y'", "x' z", "x' z'", "x2", "x2 y", "x2 y'", "x2 z", "x2 z'", "y", "y'", "y2", "z", "z'", "z2"];
                for (var i = 0; i < rotations.length; i++) {
                    var rot = rotations[i];
                    // apply rotation, auf, alg, inverse rotation
                    var result = Cube.alg(rot, Cube.alg(alg, Cube.alg(rot, instance)), true);
                    if (verify(result, false)) return true;
                }
                // again, looking for partial matches
                for (var i = 0; i < rotations.length; i++) {
                    var rot = rotations[i];
                    var result = Cube.alg(rot, Cube.alg(alg, Cube.alg(rot, instance)), true);
                    if (verify(result, true)) return true;
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
            queued++;
            window.setTimeout(check, 50);
        }

        function showConnectButton() {
            var btn = document.getElementById("giikerConnect");
            btn.disabled = false;
            btn.innerText = Localization.getString("giikerConnect");
            document.getElementById("cube").style.marginTop = "-80px";
            document.getElementById("giiker").style.display = "";
            document.getElementById("giikerDisconnectSection").style.display = "none";
        }

        function hideConnectButton() {
            document.getElementById("giiker").style.display = "none";
            document.getElementById("giikerDisconnectSection").style.display = "";
            document.getElementById("cube").style.marginTop = "0";
        }

        function connected() {
            hideConnectButton();
            next();
        }

        function error(ex) {
            showConnectButton();
            alert(ex.message);
        }

        function giikerConnect() {
            var btn = document.getElementById("giikerConnect");
            btn.disabled = true;
            btn.innerText = Localization.getString("giikerConnecting");
            Giiker.connect(connected, twist, error);
        }

        function giikerDisconnect() {
            showConnectButton();
            Giiker.disconnect();
        }

        var instance = Cube.solved;
        var alg = "";
        var auf = "";
        var solution = "";
        var kind = "";

        function update(cube) {
            var upcols = Settings.values.upColors;
            var simple = Settings.values.simpleDiagram;
            var diagKind = kind;
            if (diagKind == "cmll") {
                var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                if (numColors > 1) diagKind += "_c";
            }
            document.getElementById("cube").innerHTML = Display.diagram(cube, diagKind, simple);
        }

        function next() {
            function randomElement(arr) {
                return arr[Math.floor(Math.random() * arr.length)];
            }
            function prependAuf(auf, alg) {
                var sansAuf = alg;
                if (alg.startsWith("U ")) sansAuf = alg.substr(2);
                else if (alg.startsWith("U' ")) sansAuf = alg.substr(3);
                else if (alg.startsWith("U2 ")) sansAuf = alg.substr(3);
                var testInstance = Cube.alg(solution, Cube.solved, true); // apply random AUF + alg to solved
                if (verifyComplete(Cube.alg(sansAuf, testInstance))) return sansAuf;
                if (verifyComplete(Cube.alg("U " + sansAuf, testInstance))) return "(U) " + sansAuf;
                if (verifyComplete(Cube.alg("U' " + sansAuf, testInstance))) return "(U') " + sansAuf;
                if (verifyComplete(Cube.alg("U2 " + sansAuf, testInstance))) return "(U2) " + sansAuf;
                throw "No possible solution!";
            }
            function lookupAlg(name) {
                for (var s in Algs.sets) {
                    var set = Algs.sets[s];
                    for (var a in set.algs) {
                        var alg = set.algs[a];
                        if (name == (s + '_' + alg.id)) {
                            kind = set.algs[a].kind;
                            return { set: set, alg: set.algs[a] };
                        }
                    }
                }
                return undefined;
            }
            function challenge(cas) {
                if (!cas) cas = { id: "unknown", name: "Unknown", alg: "", kind: "coll" }; // solved (default)
                auf = Settings.values.randomAuf ? randomElement(["", "U ", "U' ", "U2 "]) : "";
                solution = auf + cas.alg;
                instance = Cube.solved;
                // up color
                var rot = [];
                var upcols = Settings.values.upColors;
                if (upcols.yellow) rot.push("");
                if (upcols.white) rot.push("x2");
                if (upcols.red) rot.push("x");
                if (upcols.orange) rot.push("x'");
                if (upcols.green) rot.push("z'");
                if (upcols.blue) rot.push("z");
                instance = Cube.random(rot, 1, instance);
                if (cas.kind != "eo" && cas.kind != "eolr") { // TODO: support setting front color as well
                    instance = Cube.random(["", "y", "y'", "y2"], 1, instance); // random orientation around y-axis
                }
                var upColor = Cube.faceColor("U", Cube.faces(instance));
                if (cas.kind == "cmll") {
                    // scramble M-slice with U-layer
                    instance = Cube.random(["U", "U'", "U2", "M", "M'", "M2"], 100, instance);
                }
                // apply solution
                instance = Cube.alg(solution, instance, true);
                if (cas.kind == "cmll") {
                    var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                    if (numColors > 1) {
                        // adjust M-slice so center top indicates color (too confusing otherwise!)
                        while (Cube.faceColor("U", Cube.faces(instance)) != upColor) {
                            instance = Cube.alg("M", instance);
                        }
                    }
                }
            }
            alg = "";
            kind = "pll"; // default
            while (Settings.values.algs.length > 0) {
                var rand = randomElement(Settings.values.algs);
                var lookup = lookupAlg(rand);
                if (!lookup) {
                    Settings.values.algs.splice(Settings.values.algs.indexOf(rand), 1); // remove
                    Settings.save();
                    continue;
                }
                challenge(lookup.alg);
                document.getElementById("popup").innerHTML = '<h4>' + prependAuf(auf, lookup.alg.alg) + '</h4><a target="_blank" style="padding-left: 0.5em" href="' + lookup.set.source + '">' + Localization.getString("moreInfo") + '</a>';
                setStatus("init");
                break;
            }
            if (Settings.values.algs.length == 0) {
                challenge(undefined); // solved (default)
                document.getElementById("popup").innerText = "";
                setStatus("error");
            }
            update(instance);
            $("#popup").popup("close");
        }

        function retry() {
            if (partial) instance = partial;
            alg = "";
            update(instance);
            setStatus("init");
        }

        return {
            twist: twist,
            giikerConnect: giikerConnect,
            giikerDisconnect: giikerDisconnect,
            next: next,
            retry: retry,
            showConnectButton: showConnectButton
        };
    }());
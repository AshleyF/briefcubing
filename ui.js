        var Ui = (function () {
            var timer;
            function checkProgress() {
                if (timer) window.clearTimeout(timer);
                var timeout = Settings.values.timeout * 1000;
                if (timeout <= 10000) {
                    timer = window.setTimeout(function () { if (lastStatus == "progress") setStatus("incorrect"); }, timeout);
                }
            }

            var lastStatus = "init";
            var completed = false;
            var partial = null;
            var initiallyPartial = false;
            var algIndex = 0;

            var incorrect = new Audio("incorrect.wav");
            incorrect.load();
            var correct = new Audio("correct.wav");
            correct.load();

            var recognitionStart = null;
            var executionStart = null;
            var executionStop = null;

            function getAlgStats() {
                var stats = Settings.values.algStats[algId];
                if (!stats) stats = Settings.values.algStats[algId] = { reco: [], exec: [], solves: {total: 0, correct: 0} };
                return stats;
            }

            function updateStats() {
                function renderSpan(span) {
                    span = Math.trunc(span);
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
                function addStatAndAverage(stat, val) {
                    stat.push(val);
                    while (stat.length > 5) stat.shift();
                    var sum = 0;
                    var count = 0;
                    for (var i = 0; i < stat.length; i++) {
                        var s = stat[i];
                        if (s < 10000) { // ignore 10sec+
                            sum += s;
                            count++;
                        }
                    }
                    if (count <= 1) return undefined;
                    return sum / count;
                }
                function renderAvg(show, span) {
                    return show ? " (" + Localization.getString("meanTime") + " " + renderSpan(span) + ")" : "";
                }
                var now = new Date();
                var reco = recognitionStart ? (executionStart || now) - recognitionStart : 0;
                var exec = executionStart ? (executionStop || now) - executionStart : 0;
                var stats = getAlgStats();
                var avgReco = addStatAndAverage(stats.reco, reco);
                var avgExec = addStatAndAverage(stats.exec, exec);
                Settings.save();
                var showAvg = avgReco && avgExec;
                var successRate = (stats.solves.correct / stats.solves.total * 100).toFixed(2);
                var htm = '<table style="margin-left:auto;margin-right:auto">';
                htm += '<tr><td align="right">' + Localization.getString("recognitionTime") + ':</td><td>' + renderSpan(reco) + renderAvg(showAvg, avgReco) + '</td></tr>';
                htm += '<tr><td align="right">' + Localization.getString("executionTime") + ':</td><td>' + renderSpan(exec) + renderAvg(showAvg, avgExec) + '</td></tr>';
                htm += '<tr><td align="right"></td><td style="font-weight: bold; border-top: 1px solid white">' + renderSpan(reco + exec) + renderAvg(showAvg, avgReco + avgExec) + '</td></tr>';
                if (Localization.getString("successRate")) {
                    htm += '<tr><td align="right">' + Localization.getString("successRate") + ':</td><td align="left">' + successRate + '% (' + stats.solves.correct + '/' + stats.solves.total + ')' + '</td></tr>';
                }
                htm += '</table>';
                document.getElementById("message").innerHTML = htm;
            }

            function updateSolveCount(isCorrect) {
                var stats = getAlgStats();
                var solves = stats.solves;
                if (!solves) solves = stats.solves = {total: 0, correct: 0};
                solves.total += 1;
                if (isCorrect) solves.correct += 1;
                Settings.save();
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
                        updateSolveCount(true);
                        updateStats();
                        correct.play();
                        document.getElementById("diagram").style.backgroundColor = "green";
                        document.getElementById("retry").disabled = false;
                        document.getElementById("next").disabled = false;
                        completed = true;
                        partial = null;
                        initiallyPartial = false;
                        $("#popup").popup("close");
                        break;
                    case "partial":
                        document.getElementById("status").innerHTML = setName;
                        document.getElementById("diagram").style.backgroundColor = "goldenrod";
                        document.getElementById("retry").disabled = false;
                        document.getElementById("next").disabled = false;
                        completed = false;
                        break;
                    case "incorrect":
                        stopExecution();
                        updateSolveCount(false);
                        incorrect.play();
                        document.getElementById("diagram").style.backgroundColor = "darkred";
                        document.getElementById("retry").disabled = false;
                        document.getElementById("next").disabled = false;
                        completed = true;
                        partial = null;
                        initiallyPartial = false;
                        break;
                    case "skip":
                        stopExecution();
                        incorrect.play();
                        document.getElementById("diagram").style.backgroundColor = "gray";
                        document.getElementById("retry").disabled = false;
                        document.getElementById("next").disabled = false;
                        completed = true;
                        partial = null;
                        initiallyPartial = false;
                        break;
                    case "progress":
                        startOrContinueExecution();
                        document.getElementById("diagram").style.backgroundColor = (partial ? "goldenrod" : "#444");
                        document.getElementById("retry").disabled = false;
                        document.getElementById("next").disabled = false;
                        completed = false;
                        checkProgress();
                        break;
                    case "init":
                        startRecognition();
                        document.getElementById("status").innerHTML = setName;
                        document.getElementById("diagram").style.backgroundColor = "transparent";
                        document.getElementById("retry").disabled = true;
                        document.getElementById("next").disabled = false;
                        completed = false;
                        partial = null;
                        initiallyPartial = verifyPartial(instance);
                        document.getElementById("message").innerHTML = '<br /><br /><a href="#popup" data-rel="popup" data-transition="pop" style="font-size: small; margin-left: 0.5em; padding: 1em">' + Localization.getString("hint") + '</a>';
                        break;
                    case "error":
                        stopExecution();
                        document.getElementById("status").innerHTML = setName;
                        document.getElementById("diagram").style.backgroundColor = "transparent";
                        document.getElementById("retry").disabled = true;
                        document.getElementById("next").disabled = true;
                        completed = false;
                        document.getElementById("message").innerText = ""; // remove "Hint" link
                        break;
                }
            }

            function verifyPartial(result) {
                // check partial match (corners oriented, but not permuted)
                var pat = Algs.kindToParams(kind).verify.partial;
                return pat == undefined ? false : Cube.matchPattern(pat, result);
            }

            function verifyComplete(result) {
                function checkEO() {
                    function opposite(c) {
                        switch (c) {
                            case 'U': return 'D';
                            case 'D': return 'U';
                            case 'L': return 'R';
                            case 'R': return 'L';
                            case 'F': return 'B';
                            case 'B': return 'F';
                            default: throw "Unknown face: " + c;
                        }
                    }
                    var state = Cube.toString(result);
                    var u = state[0]; // Ubl face
                    var d = opposite(u);
                    for (var i = 0; i < 9; i++) { // U face
                        var s = state[i];
                        if (s != u && s != d) return false;
                    }
                    for (var i = 36; i < 45; i++) { // D face
                        var s = state[i];
                        if (s != u && s != d) return false;
                    }
                    return true;
                }
                function matchWithAdjustments(pat, allowRandomM, allowRandomM2, allowRandomU) {
                    if (Cube.matchPattern(pat, result)) return true;
                    if (allowRandomU) {
                        if (Cube.matchPattern(pat, Cube.alg("U", result))) return true;
                        if (Cube.matchPattern(pat, Cube.alg("U'", result))) return true;
                        if (Cube.matchPattern(pat, Cube.alg("U2", result))) return true;
                    }
                    if (allowRandomM2 || allowRandomM) {
                        // try flipping up/down centers (maintaining edge orientation)
                        if (Cube.matchPattern(pat, Cube.alg("L2 R2", result))) return true;
                        if (Cube.matchPattern(pat, Cube.alg("L2 R2 U", result))) return true;
                        if (Cube.matchPattern(pat, Cube.alg("L2 R2 U'", result))) return true;
                        if (Cube.matchPattern(pat, Cube.alg("L2 R2 U2", result))) return true;
                    }
                    if (allowRandomM) {
                        // try flipping M-slice too because some algs (with wide moves) flip this
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
                var verify = Algs.kindToParams(kind).verify;
                if (verify.eo && !checkEO()) return false;
                return (verify.solved != undefined && matchWithAdjustments(verify.solved, verify.allowRandomM, verify.allowRandomM2, verify.allowRandomU));
            }

            function verify(result, includePartial) {
                if (verifyComplete(result)) {
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
            var lastTwist = undefined;
            function twist(t) {
                var now = new Date();
                if (completed) {
                    if (lastTwist && (now - lastTwist) > 600) {
                        // retry/next with X/X'
                        if (t.endsWith("'")) retry(); else next();
                    }
                    return;
                }
                lastTwist = now;
                function check() {
                    if (--queued > 0) return; // skip checking - let future queued calls get to it
                    if (completed) return; // skip checking if already completed
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
                var twists = alg.split(' ');
                var len = twists.length;
                if (len > 4) {
                    var a = twists[len - 2];
                    var b = twists[len - 3];
                    var c = twists[len - 4];
                    var d = twists[len - 5];
                    if (a == b && b == c && c == d) {
                        setStatus("skip");
                        window.setTimeout(function() { if (t.endsWith("'")) retry(); else next(); }, 300);
                        return;
                    }
                }
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
                var btn = document.getElementById("btCubeConnect");
                btn.disabled = false;
                btn.innerText = Localization.getString("btCubeConnect");
                document.getElementById("btCube").style.display = "";
                document.getElementById("btCubeDisconnectSection").style.display = "none";
                document.getElementById("cube").style.marginTop = "-80px";
                document.getElementById("status").style.marginBottom = "80px";
                document.getElementById("message").style.marginTop = "-3em";
            }

            function hideConnectButton() {
                document.getElementById("btCube").style.display = "none";
                document.getElementById("btCubeDisconnectSection").style.display = "";
                document.getElementById("cube").style.marginTop = "0";
                document.getElementById("status").style.marginBottom = "0";
                document.getElementById("message").style.marginTop = "-1em";
            }

            function connected() {
                hideConnectButton();
                next();
            }

            function error(ex) {
                showConnectButton();
                if (!ex.message.startsWith("User cancelled")) {
                    document.getElementById("btError").innerText = Localization.getString("btError");
                    document.getElementById("btSupport").innerText = Localization.getString("btSupport");
                    document.getElementById("btAndroid").innerText = Localization.getString("btAndroid");
                    document.getElementById("btIOS").innerText = Localization.getString("btIOS");
                    document.getElementById("btMacOS").innerText = Localization.getString("btMacOS");
                    document.getElementById("btLinux").innerText = Localization.getString("btLinux");
                    document.getElementById("btWindows").innerText = Localization.getString("btWindows");
                    document.getElementById("btInfo").innerText = Localization.getString("moreInfo");
                    $("#bluetooth-help").popup("open");
                }
            }

            function btCubeConnect() {
                var btn = document.getElementById("btCubeConnect");
                btn.disabled = true;
                btn.innerText = Localization.getString("btCubeConnecting");
                BtCube.connect(connected, twist, error);
            }

            function btCubeDisconnect() {
                showConnectButton();
                BtCube.disconnect();
            }

            var instance = Cube.solved;
            var alg = "";
            var algId = "";
            var auf = "";
            var solution = "";
            var id = "";
            var kind = "";
            var setName = "";

            function update(cube) {
                var simple = Settings.values.simpleDiagram;
                var hide = Settings.values.llHide;
                var diag = Algs.kindToParams(kind).diagram;
                document.getElementById("cube").innerHTML = Display.diagram(cube, diag, id, simple, hide);
            }

            function lookupAlg(name) {
                for (var s in Algs.sets) {
                    var set = Algs.sets[s];
                    for (var a in set.algs) {
                        var alg = set.algs[a];
                        if (name == (s + '_' + alg.id)) {
                            id = set.algs[a].id;
                            kind = set.algs[a].kind;
                            setName = set.name;
                            return { set: set, alg: set.algs[a] };
                        }
                    }
                }
                return undefined;
            }

            function next() {
                function prependAuf(alg) {
                    function simplifyAuf(alg) {
                        // applies to L4E algs
                        if (alg.startsWith("(U) U2 ")) return "U' " + alg.substr(7);
                        if (alg.startsWith("(U) U2' ")) return "U' " + alg.substr(8);
                        if (alg.startsWith("(U') U2 ")) return "U " + alg.substr(8);
                        if (alg.startsWith("(U') U2' ")) return "U " + alg.substr(9);
                        return alg;
                    }
                    var sansAuf = alg;
                    if (Algs.kindToParams(kind).diagram.stripAuf) {
                        if (alg.startsWith("U ")) sansAuf = alg.substr(2);
                        else if (alg.startsWith("U' ")) sansAuf = alg.substr(3);
                        else if (alg.startsWith("U2 ")) sansAuf = alg.substr(3);
                    }
                    var testInstance = Cube.alg(solution, Cube.solved, true); // apply random AUF + alg to solved
                    var sansAufSansParens = sansAuf.replace(/[\(\)]/g, '');
                    if (verifyComplete(Cube.alg(sansAufSansParens, testInstance))) return sansAuf;
                    if (verifyComplete(Cube.alg("U " + sansAufSansParens, testInstance))) return simplifyAuf("(U) " + sansAuf);
                    if (verifyComplete(Cube.alg("U' " + sansAufSansParens, testInstance))) return simplifyAuf("(U') " + sansAuf);
                    if (verifyComplete(Cube.alg("U2 " + sansAufSansParens, testInstance))) return "(U2) " + sansAuf;
                    throw "No possible solution!";
                }
                function randomElement(arr) {
                    return arr[Math.floor(Math.random() * arr.length)];
                }
                function challenge(cas) {
                    var params = Algs.kindToParams(kind);
                    var scramble = params.scramble;
                    if (!cas) cas = { id: "unknown", name: "", alg: "", kind: "coll" }; // solved (default)
                    auf = "";
                    if (scramble.allowAuf) {
                        if (Settings.values.randomAuf) {
                            auf = randomElement(["", "U ", "U' ", "U2 "]);
                        } else {
                            auf = Settings.values.algAufPrefs[algId] || "";
                        }
                    }
                    if (scramble.randomSingleU) auf = randomElement(["U ", "U' "]); // used by L4E algs
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
                    if (scramble.randomOrientationAroundY) {
                        instance = Cube.random(["", "y", "y'", "y2"], 1, instance); // random orientation around y-axis
                    }
                    if (Settings.values.simpleDiagram) {
                        instance = Display.maskPieces(params.diagram.simplified, instance)
                    }
                    var upColor = Cube.faceColor("U", Cube.faces(instance));
                    if (scramble.randomMU) {
                        if (scramble.allowEOFlips) {
                            // scramble M-slice with U-layer
                            instance = Cube.random(["U", "U'", "U2", "M", "M'", "M2"], 100, instance);
                        } else {
                            // scramble M-slice with U-layer (without flips)
                            instance = Cube.random(["U", "U'", "U2", "M2", "R2 U R U R' U' R' U' R' U R'", "R U' R U R U R U' R' U' R2", "M2' U M2' U M' U2 M2' U2 M'", "M2' U M2' U2 M2' U M2'"], 100, instance);
                        }
                    }
                    // apply solution
                    instance = Cube.alg(solution, instance, true);
                    if (params.diagram.simplified.hideUCenter) {
                        var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                        if (numColors > 1 || params.diagram.simplified.hideInsignificantCornerFaces) {
                            // adjust M-slice so center top indicates color (too confusing otherwise!)
                            while (Cube.faceColor("U", Cube.faces(instance)) != upColor) {
                                instance = Cube.alg("M", instance);
                            }
                        }
                    }
                }
                alg = "";
                id = "";
                kind = "pll"; // default
                while (Settings.values.algs.length > 0) {
                    var nextAlg;
                    if (Settings.values.randomOrder) {
                        nextAlg = randomElement(Settings.values.algs);
                    } else {
                        if (algIndex >= Settings.values.algs.length) algIndex = 0;
                        nextAlg = Settings.values.algs[algIndex++];
                    }
                    var lookup = lookupAlg(nextAlg);
                    if (!lookup) {
                        Settings.values.algs.splice(Settings.values.algs.indexOf(nextAlg), 1); // remove
                        Settings.save();
                        continue;
                    }
                    algId = lookup.alg.kind + "_" + lookup.alg.id;
                    challenge(lookup.alg);
                    document.getElementById("popup").innerHTML = '<h4>' + prependAuf(lookup.alg.display) + '</h4><a target="_blank" style="padding-left: 0.5em" href="' + lookup.set.source + '">' + Localization.getString("moreInfo") + '</a>';
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

            function adjustAUF(e) {
                function next() {
                    switch (auf) {
                        case "": return "U' ";
                        case "U' ": return "U2 ";
                        case "U2 ": return "U ";
                        case "U ": return "";
                    }
                }
                var x = e.offsetX / e.currentTarget.clientWidth;
                var y = e.offsetY / e.currentTarget.clientHeight;
                if (x > 0.15 && x < 0.85 && y > 0.15 && y < 0.85) { // near center to avoid intercepting taps on other UI elements
                    auf = next();
                    Settings.values.algAufPrefs[algId] = auf;
                    Settings.save();
                    instance = Cube.alg("U", instance);
                    update(instance);
                    var aufDisplay = auf == "" ? "" : "(" + auf.substr(0, auf.length - 1) + ") ";
                    var lookup = lookupAlg(algId);
                    document.getElementById("popup").innerHTML = '<h4>' + aufDisplay + lookup.alg.display + '</h4><a target="_blank" style="padding-left: 0.5em" href="' + lookup.set.source + '">' + Localization.getString("moreInfo") + '</a>';
                }
            }

            function retry() {
                if (partial) instance = partial;
                alg = "";
                update(instance);
                setStatus("init");
            }

            return {
                twist: twist,
                btCubeConnect: btCubeConnect,
                btCubeDisconnect: btCubeDisconnect,
                next: next,
                retry: retry,
                adjustAUF: adjustAUF,
                showConnectButton: showConnectButton
            };
        }());
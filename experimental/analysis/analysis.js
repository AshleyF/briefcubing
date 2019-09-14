const {Sequence, algToString} = cubing.alg;
const {Puzzles, SVG, Combine, Multiply, IdentityTransformation, Invert, EquivalentTransformations, KPuzzle, EquivalentStates} = cubing.kpuzzle;
const {Twisty} = cubing.twisty
  
const {connect, debugKeyboardConnect, enableDebugLogging} = cubing.bluetooth;
const def = Puzzles["333"];
const svg = new SVG(def);

var alg = [];
async function onMove(e) {
    var foo = alg;
    alg = [];
    for (var i in foo) {
        alg.push(foo[i]);
    }
    alg.push(e.latestMove);
    document.querySelector("#alg").textContent = algToString(new Sequence(alg));
    svg.draw(def, e.state);
    player.anim.tempo = 6;
    player.experimentalSetAlg(new Sequence(alg));
    /*
    player.anim.skipToEnd();
    player.cursor.experimentalSetMoves(new Sequence(alg));
    // player.anim.skipToEnd();
    player.alg = new Sequence(alg);
    player.player.updateFromAnim();
    player.anim.stepForward();
    player.anim.skipToEnd();
    // player.player.cube3DView.cube3D.cube.useQuaternion(e.quaternion);
    // player.player.cube3DView.cube3D.scene.queueMoves([e.latestMove]);
    // player.player.cube3DView.cube3D.scene.play.start();
    */

    var state = await puzzle.getState();
    document.querySelector("#debug").textContent = JSON.stringify(state);

    var test = Invert(def, state);
}

var puzzle;
var player;
async function connectBluetooth() {
    puzzle = await connect();
    puzzle.addMoveListener(onMove);
    document.getElementById("display").appendChild(svg.element);
    player = new Twisty(document.getElementById("twisty"));
}

/*

def.moves
    B D E F L M R S U
    b d   f l   r   u
    x y z
   .startPieces
        CENTER numPieces: 6  orientations: 4
        CORNER numPieces: 8  orientations: 3
        EDGE   numPieces: 12 orientations: 2

*/
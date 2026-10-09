// Run with: node --test tests/gan-v4.test.js
// Offline packet tests; hardware pairing still requires a GAN Gen4 cube.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const GanV4 = require("../gan-v4.js");

function event(serial, axis = 2) {
    return Uint8Array.of(1, 0, 0, 0, 0, 0, serial, 0, axis);
}
function baseline(serial) {
    return Uint8Array.of(0xED, 0, serial, 0);
}

test("uses the Gen4 Bluetooth service, distinct from legacy FFF0", () => {
    assert.equal(GanV4.SERVICE_UUID, "00000010-0000-fff7-fff6-fff5fff4fff0");
});

test("decodes twelve face and direction combinations", () => {
    const faces = [2, 32, 8, 1, 16, 4];
    faces.forEach((bit, index) => {
        for (const direction of [0, 1]) {
            assert.deepEqual(
                GanV4.decodeMove(event(42, bit | (direction << 6))),
                { serial: 42, move: "URFDLB"[index] + (direction ? "'" : "") }
            );
        }
    });
});

test("rejects malformed and incomplete moves", () => {
    assert.equal(GanV4.decodeMove(event(2, 3)), null);
    assert.equal(GanV4.decodeMove(event(2, 0x82)), null);
    assert.equal(GanV4.decodeMove(Uint8Array.of(1, 2)), null);
});

test("decodes history as newest-first face/direction nibbles", () => {
    assert.deepEqual(GanV4.decodeHistory(Uint8Array.of(0xD1, 2, 13, 0x20)), [
        { serial: 13, move: "U" },
        { serial: 12, move: "D" }
    ]);
});

test("starts from baseline and ignores duplicate move notifications", () => {
    const moves = [];
    const tracker = GanV4.createTracker(move => moves.push(move), () => {});
    tracker.handle(event(11));
    assert.deepEqual(moves, [], "moves before baseline must not be guessed");
    tracker.handle(baseline(10));
    tracker.handle(event(11));
    tracker.handle(event(11));
    tracker.handle(event(12));
    assert.deepEqual(moves, ["U", "U"]);
});

test("buffers gaps and emits recovered history in chronological order", () => {
    const moves = [];
    const tracker = GanV4.createTracker(move => moves.push(move), () => {});
    tracker.handle(baseline(11));
    tracker.handle(event(13, 32));
    assert.deepEqual(moves, []);
    tracker.handle(Uint8Array.of(0xD1, 2, 12, 0x20));
    assert.deepEqual(moves, ["U", "R"]);
});

test("correctly handles an 8-bit move counter wrapping from 255 to 0", () => {
    const moves = [];
    const tracker = GanV4.createTracker(move => moves.push(move), () => {});
    tracker.handle(baseline(255));
    tracker.handle(event(0));
    assert.deepEqual(moves, ["U"]);
});

test("refuses to silently advance over unrecoverably large gaps", () => {
    const moves = [];
    const tracker = GanV4.createTracker(move => moves.push(move), () => {});
    tracker.handle(baseline(10));
    assert.throws(() => tracker.handle(event(40)), /gap too large/);
    assert.deepEqual(moves, []);
});

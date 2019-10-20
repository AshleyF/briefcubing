var aes128 = (function() {
    var sbox = [99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22];
    var sboxI = [];
    var shiftTabI = [0, 13, 10, 7, 4, 1, 14, 11, 8, 5, 2, 15, 12, 9, 6, 3];
    var xtime = [];
    function shiftSubAdd(state, rkey) {
        var state0 = state.slice();
        for (var i = 0; i < 16; i++) {
            state[i] = sboxI[state0[shiftTabI[i]]] ^ rkey[i];
        }
    }
    function init() {
        if (xtime.length != 0) {
            return;
        }
        for (var i = 0; i < 256; i++) {
            sboxI[sbox[i]] = i;
        }
        for (var i = 0; i < 128; i++) {
            xtime[i] = i << 1;
            xtime[128 + i] = (i << 1) ^ 0x1b;
        }
    }
    function AES128(key) {
        init();
        var exKey = key.slice();
        var Rcon = 1;
        for (var i = 16; i < 176; i += 4) {
            var tmp = exKey.slice(i - 4, i);
            if (i % 16 == 0) {
                tmp = [sbox[tmp[1]] ^ Rcon, sbox[tmp[2]], sbox[tmp[3]], sbox[tmp[0]]];
                Rcon = xtime[Rcon];
            }
            for (var j = 0; j < 4; j++) {
                exKey[i + j] = exKey[i + j - 16] ^ tmp[j];
            }
        }
        this.key = exKey;
    };
    AES128.prototype.decrypt = function(block) {
        var rkey = this.key.slice(160, 176);
        for (var i = 0; i < 16; i++) {
            block[i] ^= rkey[i];
        }
        for (var i = 144; i >= 16; i -= 16) {
            shiftSubAdd(block, this.key.slice(i, i + 16));
            for (var j = 0; j < 16; j += 4) {
                var s0 = block[j + 0];
                var s1 = block[j + 1];
                var s2 = block[j + 2];
                var s3 = block[j + 3];
                var h = s0 ^ s1 ^ s2 ^ s3;
                var xh = xtime[h];
                var h1 = xtime[xtime[xh ^ s0 ^ s2]] ^ h;
                var h2 = xtime[xtime[xh ^ s1 ^ s3]] ^ h;
                block[j + 0] ^= h1 ^ xtime[s0 ^ s1];
                block[j + 1] ^= h2 ^ xtime[s1 ^ s2];
                block[j + 2] ^= h1 ^ xtime[s2 ^ s3];
                block[j + 3] ^= h2 ^ xtime[s3 ^ s0];
            }
        }
        shiftSubAdd(block, this.key.slice(0, 16));
        return block;
    };
    return AES128;
})();

async function connect()
{
    try
    {
        const GAN_ENCRYPTION_KEYS = [
            "NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA",
            "NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g"];
        const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
        const GAN_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";
        const GAN_SERVICE_UUID_META = "0000180a-0000-1000-8000-00805f9b34fb";
        const GAN_CHARACTERISTIC_VERSION = "00002a28-0000-1000-8000-00805f9b34fb";
        const GAN_CHARACTERISTIC_UUID_HARDWARE = "00002a23-0000-1000-8000-00805f9b34fb";
        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [GAN_SERVICE_UUID, GAN_SERVICE_UUID_META] });
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });
        var server = await device.gatt.connect();
        decoder = null;
        var meta = await server.getPrimaryService(GAN_SERVICE_UUID_META);
        var versionCharacteristic = await meta.getCharacteristic(GAN_CHARACTERISTIC_VERSION);
        var versionValue = await versionCharacteristic.readValue();
        var version = versionValue.getUint8(0) << 16 | versionValue.getUint8(1) << 8 | versionValue.getUint8(2);
        if (version > 0x010007 && (version & 0xfffe00) == 0x010000) {
            var hardwareCharacteristic = await meta.getCharacteristic(GAN_CHARACTERISTIC_UUID_HARDWARE);
            var hardwareValue = await hardwareCharacteristic.readValue();
            var key = GAN_ENCRYPTION_KEYS[version >> 8 & 0xff];
            if (!key) throw "Unsupported GAN cube with unknown encryption key.";
            key = JSON.parse(LZString.decompressFromEncodedURIComponent(key));
            for (var i = 0; i < 6; i++) {
                key[i] = (key[i] + hardwareValue.getUint8(5 - i)) & 0xff;
            }
            decoder = new aes128(key);
        }
        var service = await server.getPrimaryService(GAN_SERVICE_UUID);
        var characteristic = await service.getCharacteristic(GAN_CHARACTERISTIC_UUID);
        pollCharacteristic(characteristic);
    }
    catch (ex)
    {
        alert("ERROR: " + ex);
    }
}

var decoder = null;
function decode(value) {
    if (decoder == null) return value;
    var decoded = [];
    for (var i = 0; i < value.byteLength; i++) {
        decoded[i] = value.getUint8(i);
    }
    if (decoded.length > 16) {
        decoded = decoded.slice(0, decoded.length - 16).concat(decoder.decrypt(decoded.slice(decoded.length - 16)));
    }
    decoder.decrypt(decoded);
    return new DataView(new Uint8Array(decoded).buffer);
}

var initial = undefined;
async function pollCharacteristic(cubeCharacteristic) {
    try {
        var value = decode(await cubeCharacteristic.readValue());

        // pose
        var xr = value.getInt16(0, true);
        var yr = value.getInt16(2, true);
        var zr = value.getInt16(4, true);

        var htm = "<b>Raw:</b><br />x: " + Math.round(xr) + "<br />y: " + Math.round(yr) + "<br />z: " + Math.round(zr) + "<br />";

        // convert angles
        var x = xr / 16384; // * Math.PI;
        var y = yr / 16384; // * Math.PI;
        var z = zr / 16384; // * Math.PI;
        var ww = 1 - (x * x + y * y + z * z);
        var w = ww > 0 ? Math.sqrt(ww) : 0;
        htm += "<b>Quaternion:</b><br />x: " + x + "<br />y: " + y + "<br />z: " + z + "<br />w: " + w + "<br />";

        // var current = { w: w, x: x, y: y, z: z }
        var current = { w: w, x: x, y: y, z: z }
        if (!initial) {
            // inverse
            var n = current.w * current.w + current.x * current.x + current.y * current.y + current.z * current.z;
            if (n === 0) {
                initial = { w: 1, x: 0, y: 0, z: 0 };
            } else {
                n = 1 / n;
                initial = { w: current.w * n, x: -current.x * n, y: -current.y * n, z: -current.z * n };
            }
        }

        var diff = {
            w: initial.w * current.w - initial.x * current.x - initial.y * current.y - initial.z * current.z,
            x: initial.w * current.x + initial.x * current.w + initial.y * current.z - initial.z * current.y,
            y: initial.w * current.y + initial.y * current.w + initial.z * current.x - initial.x * current.z,
            z: initial.w * current.z + initial.z * current.w + initial.x * current.y - initial.y * current.x }

        var d = toEuler(diff.w, diff.x, diff.y, diff.z);
        htm += "<b>Euler:</b><br />x: " + d.x + "<br />y: " + d.y + "<br />z: " + d.z + "<br />";

        // map to up/front colors
        var rx = faceRotation(d.x);
        var ry = faceRotation(d.y);
        var rz = faceRotation(d.z);
        var colors =
            [
                [
                    ["?? 00", "?? 01", "?? 02", "?? 03"],
                    ["RG 04", "RW 05", "RB 06", "RY 07"],
                    ["YG 08", "YR 09", "YB 10", "YO 11"],
                    ["OG 12", "OY 13", "OB 14", "OW 15"]
                ],
                [
                    ["?? 16", "?? 17", "?? 18", "?? 19"],
                    ["RW 20", "RB 21", "RY 22", "RG 23"],
                    ["GW 24", "GR 25", "GY 26", "GO 27"],
                    ["OG 28", "OG 29", "OY 30", "OB 31"]
                ],
                [
                    ["?? 32", "?? 33", "?? 34", "?? 35"],
                    ["RB 36", "RY 37", "RG 38", "RW 39"],
                    ["WB 40", "WR 41", "WG 42", "WO 43"],
                    ["OB 44", "OW 45", "OG 46", "OY 47"]
                ],
                [
                    ["?? 48", "?? 49", "?? 50", "?? 51"],
                    ["RY 52", "RG 53", "G3 54", "RB 55"],
                    ["BY 56", "BR 57", "BW 58", "BO 59"],
                    ["OY 60", "OB 61", "OW 62", "OG 63"]
                ]
            ];
        var uc = colors[rx][ry][rz]; // [rz];

        htm += "<br /><b>Colors:</b><br />Up/Front: " + uc[0] + "/" + uc[1] + " (" + uc[3] + uc[4] + ")";

        document.getElementById("pose").innerHTML = htm;

        // encoders
        var sides = "URFDLB";
        htm = "";
        for (var i = 0; i < 6; i++)
        {
            htm += sides[i] + ": " + value.getUint8(i + 6) + "<br />";
        }
        document.getElementById("encoders").innerHTML = htm;

        // twists
        var twists = ["U", "?", "U'", "R", "?", "R'", "F", "?", "F'", "D", "?", "D'", "L", "?", "L'", "B", "?", "B'"]
        var htm = "Count: " + value.getUint8(12) + "<br />";
        for (var i = 13; i < 19; i++)
        {
            htm += twists[value.getUint8(i)] + " ";
        }
        document.getElementById("twists").innerHTML = htm;

        window.setTimeout(async function() { await pollCharacteristic(cubeCharacteristic); }, 50);
    } catch (ex) {
        alert("ERROR (G): " + ex.message);
    }
}

function toEuler(w, x, y, z) {
	var sp = 2 * (w * y - z * x);
    return {
        x: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
        y: Math.abs(sp) < 1 ? Math.asin(sp) : Math.sign(sp) * Math.PI / 2,
        z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) };
}

function faceRotation(r) {
    if (r < -3 * Math.PI / 4) return 0;
    if (r < -Math.PI / 4) return 1;
    if (r > 3 * Math.PI / 4) return 0;
    if (r > Math.PI / 4) return 3;
    return 2;
}
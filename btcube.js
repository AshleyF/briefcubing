// This is a modified version of lgarron's code from https://github.com/cubing/cuble.js
// GAN decryption is a modified version of code from https://github.com/cs0x7f/cstimer

var BtCube = (function () {
    const GIIKER_SERVICE_UUID = "0000aadb-0000-1000-8000-00805f9b34fb";
    const GIIKER_CHARACTERISTIC_UUID = "0000aadc-0000-1000-8000-00805f9b34fb";

    const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
    const GAN_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";
    const GAN_SERVICE_UUID_META = "0000180a-0000-1000-8000-00805f9b34fb";
    const GAN_CHARACTERISTIC_VERSION = "00002a28-0000-1000-8000-00805f9b34fb";
    const GAN_CHARACTERISTIC_UUID_HARDWARE = "00002a23-0000-1000-8000-00805f9b34fb";
    const GAN_ENCRYPTION_KEYS = [
        "NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA",
        "NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g"];

    const GOCUBE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const GOCUBE_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

    var device;
    var ganDecoder = null;
    async function connect(connectedCallback, twistCallback, errorCallback) {
        try {
            device = await window.navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Gi" }, { namePrefix: "GAN-" }, { namePrefix: "GoCube_" }],
            optionalServices: [
                GIIKER_SERVICE_UUID,
                GAN_SERVICE_UUID, GAN_SERVICE_UUID_META,
                GOCUBE_SERVICE_UUID
            ]
            });
            var server = await device.gatt.connect();
            if (server.device.name.startsWith("GAN-")) {
                ganDecoder = null;
                var meta = await server.getPrimaryService(GAN_SERVICE_UUID_META);
                var versionCharacteristic = await meta.getCharacteristic(GAN_CHARACTERISTIC_VERSION);
                var versionValue = await versionCharacteristic.readValue();
                var version = versionValue.getUint8(0) << 16 | versionValue.getUint8(1) << 8 | versionValue.getUint8(2);
                if (version > 0x010007 && (version & 0xfffe00) == 0x010000) {
                    var hardwareCharacteristic = await meta.getCharacteristic(GAN_CHARACTERISTIC_UUID_HARDWARE);
                    var hardwareValue = await hardwareCharacteristic.readValue();
                    var key = GAN_ENCRYPTION_KEYS[version >> 8 & 0xff];
                    if (!key) {
                        alert("Unsupported GAN cube with unknown encryption key.");
                        errorCallback()
                        return;
                    }
                    key = JSON.parse(LZString.decompressFromEncodedURIComponent(key));
                    for (var i = 0; i < 6; i++) {
                        key[i] = (key[i] + hardwareValue.getUint8(5 - i)) & 0xff;
                    }
                    ganDecoder = new aes128(key);
                }
                var cubeService = await server.getPrimaryService(GAN_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GAN_CHARACTERISTIC_UUID);
                onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback);
            } else if (server.device.name.startsWith("Gi")) {
                var cubeService = await server.getPrimaryService(GIIKER_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GIIKER_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGiikerCubeCharacteristicChanged.bind(twistCallback));
                await cubeCharacteristic.startNotifications();
            } else if (server.device.name.startsWith("GoCube_")) {
                var cubeService = await server.getPrimaryService(GOCUBE_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GOCUBE_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGoCubeCharacteristicChanged.bind(twistCallback));
                await cubeCharacteristic.startNotifications();
            } else {
                throw "Unknown device: " + server.device.name;
            }

            device.addEventListener('gattserverdisconnected', disconnected.bind(errorCallback));
            connectedCallback();
        } catch (ex) {
            device = null;
            errorCallback(ex);
        }
    }

    function disconnected() {
        device = null;
    }

    function connected() {
        return device ? true : false;
    }

    function disconnect() {
        // note: does not call disconnectedCallback
        if (connected()) device.gatt.disconnect();
    }

    var first = true;
    function onGiikerCubeCharacteristicChanged(event) {
        try {
            if (first) {
                first = false;
                return; // skip first event
            }
            var val = event.target.value;
            var state = [];
            if (val.getUint8(18) == 0xa7) { // decrypt
                var key = [176, 81, 104, 224, 86, 137, 237, 119, 38, 26, 193, 161, 210, 126, 150, 81, 93, 13, 236, 249, 89, 235, 88, 24, 113, 81, 214, 131, 130, 199, 2, 169, 39, 165, 171, 41];
                var k = val.getUint8(19);
                var k1 = k >> 4 & 0xf;
                var k2 = k & 0xf;
                for (var i = 0; i < 20; i++) {
                    var v = (val.getUint8(i) + key[i + k1] + key[i + k2]) & 0xff;
                    state.push(v >> 4 & 0xf);
                    state.push(v & 0xf);
                }
            }
            else // not encrypted
            {
                for (var i = 0; i < 20; i++) {
                    var v = val.getUint8(i);
                    state.push(v >> 4 & 0xf);
                    state.push(v & 0xf);
                }
            }
            var face = state[32];
            var amount = state[33];
            this(["?", "B", "D", "L", "U", "R", "F"][face] + ["", "", "2", "'"][amount == 9 ? 2 : amount]); // twistCallback
        } catch (ex) {
            alert("ERROR (K): " + ex.message);
        }
    }

    var lastCount = -1;
    async function onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback) {
        try {
            const twists = ["U", "?", "U'", "R", "?", "R'", "F", "?", "F'", "D", "?", "D'", "L", "?", "L'", "B", "?", "B'"]
            var val;
            try
            {
                val = await cubeCharacteristic.readValue();
                if (ganDecoder != null) {
                    var decoded = [];
                    for (var i = 0; i < val.byteLength; i++) {
                        decoded[i] = val.getUint8(i);
                    }
                    if (decoded.length > 16) {
                        decoded = decoded.slice(0, decoded.length - 16).concat(ganDecoder.decrypt(decoded.slice(decoded.length - 16)));
                    }
                    ganDecoder.decrypt(decoded);
                    val = new DataView(new Uint8Array(decoded).buffer);
                }
            } catch {
                return; // disconnected
            }
            var count = val.getUint8(12);
            if (lastCount == -1) lastCount = count;
            if (count != lastCount) {
                var missed = (count - lastCount) & 0xff;
                if (missed < 6) {
                    lastCount = count;
                    for (var i = 19 - missed; i < 19; i++) {
                        var t = val.getUint8(i);
                        twistCallback(twists[t]);
                    }
                }
            }
            window.setTimeout(async function() { await onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback); }, 50);
        } catch (ex) {
            alert("ERROR (G): " + ex.message);
        }
    }
    
    function onGoCubeCharacteristicChanged(event) {
        try {
            var val = event.target.value;
            var len = val.byteLength;
            if (len = 8 && val.getUint8(1) /* payload len */ == 6) {
                this(["B", "B'", "F", "F'", "U", "U'", "D", "D'", "R", "R'", "L", "L'"][val.getUint8(3)]);
            }
        } catch (ex) {
            alert("ERROR (K): " + ex.message);
        }
    }

    return {
        connect: connect,
        connected: connected,
        disconnect: disconnect
    };
}());

var aes128 = (function() {
    var sbox = [99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22];
    var sboxI = [];
    var shiftTabI = [0, 13, 10, 7, 4, 1, 14, 11, 8, 5, 2, 15, 12, 9, 6, 3];
    var xtime = [];
    function init() {
        if (xtime.length != 0) return;
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
    function shiftSubAdd(state, rkey) {
        var state0 = state.slice();
        for (var i = 0; i < 16; i++) {
            state[i] = sboxI[state0[shiftTabI[i]]] ^ rkey[i];
        }
    }
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
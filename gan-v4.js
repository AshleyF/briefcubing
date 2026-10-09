// GAN Gen4 Bluetooth protocol (GAN12/14/16 UI and compatible devices).
// Protocol and key derivation: https://github.com/afedotov/gan-web-bluetooth (MIT).
// Kept separate from the legacy GAN 356i and Monster Go handlers.
var GanV4 = (function () {
    "use strict";

    const SERVICE_UUID = "00000010-0000-fff7-fff6-fff5fff4fff0";
    const STATE_UUID = "0000fff6-0000-1000-8000-00805f9b34fb";
    const WRITE_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";
    const MANUFACTURER_IDS = Array.from({ length: 256 }, (_, i) => (i << 8) | 1);
    const BASE_KEY = [1, 2, 66, 40, 49, 145, 22, 7, 32, 5, 24, 84, 66, 17, 18, 83];
    const BASE_IV = [17, 3, 50, 40, 33, 1, 118, 39, 32, 149, 120, 20, 50, 18, 2, 67];
    const FACE_BITS = [2, 32, 8, 1, 16, 4]; // U R F D L B

    function parseMac(mac) {
        const value = (mac || "").trim().replace(/[:-]/g, "").toUpperCase();
        if (!/^[0-9A-F]{12}$/.test(value)) {
            throw new Error("Invalid GAN MAC address (expected AA:BB:CC:DD:EE:FF).");
        }
        return value.match(/../g).map(byte => parseInt(byte, 16)).reverse();
    }

    function macFromAdvertisement(manufacturerData) {
        if (!manufacturerData) return null;
        let data = null;
        if (manufacturerData instanceof DataView) {
            // Bluefy includes a two-byte company identifier in the raw data.
            data = new Uint8Array(manufacturerData.buffer, manufacturerData.byteOffset + 2,
                Math.max(0, manufacturerData.byteLength - 2));
        } else {
            for (const id of MANUFACTURER_IDS) {
                if (manufacturerData.has(id)) {
                    const view = manufacturerData.get(id);
                    data = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
                    break;
                }
            }
        }
        if (!data || data.length < 6) return null;
        return Array.from(data.slice(-6)).reverse().map(n => n.toString(16).padStart(2, "0")).join(":").toUpperCase();
    }

    async function findMac(device) {
        const storageKey = "gan-v4-mac:" + device.id;
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
            try { parseMac(saved); return saved; } catch (_) { window.localStorage.removeItem(storageKey); }
        }

        let mac = null;
        if (typeof device.watchAdvertisements === "function") {
            mac = await new Promise(resolve => {
                let finished = false;
                let timer;
                function finish(value) {
                    if (finished) return;
                    finished = true;
                    device.removeEventListener("advertisementreceived", onAdvertisement);
                    if (typeof device.unwatchAdvertisements === "function") device.unwatchAdvertisements();
                    window.clearTimeout(timer);
                    resolve(value);
                }
                function onAdvertisement(event) {
                    const detected = macFromAdvertisement(event.manufacturerData);
                    if (detected) finish(detected);
                }
                device.addEventListener("advertisementreceived", onAdvertisement);
                timer = window.setTimeout(() => finish(null), 5000);
                Promise.resolve().then(() => device.watchAdvertisements()).catch(() => finish(null));
            });
        }
        if (!mac) {
            mac = window.prompt(
                "Enter your GAN cube's Bluetooth MAC address (AA:BB:CC:DD:EE:FF).\n" +
                "It is needed to decrypt moves. Find it in csTimer's cube connection settings " +
                "or your cube's companion app."
            );
            if (mac === null) throw new Error("User cancelled MAC address entry");
        }
        const bytes = parseMac(mac);
        mac = bytes.slice().reverse().map(n => n.toString(16).padStart(2, "0")).join(":").toUpperCase();
        window.localStorage.setItem(storageKey, mac);
        return mac;
    }

    function makeCipher(mac) {
        const salt = parseMac(mac);
        const key = BASE_KEY.slice();
        const iv = BASE_IV.slice();
        for (let i = 0; i < 6; i++) {
            key[i] = (key[i] + salt[i]) % 255;
            iv[i] = (iv[i] + salt[i]) % 255;
        }
        const aes = new aes128(key);
        const ivBytes = new Uint8Array(iv);
        const cryptoKey = window.crypto.subtle.importKey("raw", new Uint8Array(key),
            { name: "AES-CBC" }, false, ["encrypt"]);

        function decrypt(view) {
            const data = view instanceof DataView
                ? new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice()
                : new Uint8Array(view);
            if (data.length < 16) throw new Error("Short GAN Gen4 Bluetooth packet");
            // GAN encrypts two overlapping 16-byte CBC blocks, last block first on decode.
            if (data.length > 16) {
                const start = data.length - 16;
                const block = aes.decrypt(Array.from(data.slice(start)));
                for (let i = 0; i < 16; i++) data[start + i] = block[i] ^ iv[i];
            }
            const first = aes.decrypt(Array.from(data.slice(0, 16)));
            for (let i = 0; i < 16; i++) data[i] = first[i] ^ iv[i];
            return data;
        }

        async function encrypt(message) {
            const data = new Uint8Array(message);
            if (data.length < 16) throw new Error("Short GAN Gen4 command");
            const importedKey = await cryptoKey;
            async function encryptBlock(offset) {
                // WebCrypto adds a padding block; the first ciphertext block is the
                // unpadded AES-CBC result that this protocol requires.
                const encrypted = new Uint8Array(await window.crypto.subtle.encrypt(
                    { name: "AES-CBC", iv: ivBytes }, importedKey, data.slice(offset, offset + 16)));
                data.set(encrypted.slice(0, 16), offset);
            }
            await encryptBlock(0);
            if (data.length > 16) await encryptBlock(data.length - 16);
            return data;
        }
        return { decrypt, encrypt };
    }

    function makeCommand(opcode, parameter) {
        const message = new Uint8Array(20);
        message[0] = opcode;
        message[1] = opcode === 0xDF ? 3 : 4;
        if (parameter !== undefined) message[3] = parameter;
        return message;
    }

    function decodeMove(data) {
        if (data.length < 9) return null;
        const direction = data[8] >> 6;
        const face = FACE_BITS.indexOf(data[8] & 63);
        if (face < 0 || direction > 1) return null;
        return { serial: data[6], move: "URFDLB"[face] + (direction ? "'" : "") };
    }

    function decodeHistory(data) {
        if (data.length < 4 || data[1] < 2) return [];
        const count = Math.min((data[1] - 1) * 2, (data.length - 3) * 2);
        const moves = [];
        for (let i = 0; i < count; i++) {
            const byte = data[3 + (i >> 1)];
            const nibble = i % 2 === 0 ? byte >> 4 : byte & 15;
            const face = "DUBFLR"[nibble >> 1];
            if (face) moves.push({ serial: (data[2] - i) & 255, move: face + (nibble & 1 ? "'" : "") });
        }
        return moves;
    }

    function createTracker(onMove, requestHistory) {
        let lastSerial = null;
        let pending = new Map();
        let lastMoveAt = 0;
        let lastRequested = null;

        function drain() {
            while (pending.has((lastSerial + 1) & 255)) {
                const serial = (lastSerial + 1) & 255;
                const move = pending.get(serial);
                pending.delete(serial);
                lastSerial = serial;
                onMove(move);
            }
            if (!pending.size) lastRequested = null;
        }

        function request(serial) {
            if (lastSerial === null) return;
            const gap = (serial - lastSerial) & 255;
            if (gap <= 1 || gap > 24 || serial === 0 || lastRequested === serial) return;
            lastRequested = serial;
            let start = serial % 2 === 0 ? (serial - 1) & 255 : serial;
            let count = gap + 1;
            if (count % 2) count++;
            count = Math.min(count, start + 1);
            Promise.resolve().then(() => requestHistory(start, count)).catch(err => {
                lastRequested = null;
                console.warn("GAN Gen4 history request failed:", err);
            });
        }

        function add(entry) {
            if (lastSerial === null) return;
            const distance = (entry.serial - lastSerial) & 255;
            if (distance === 0 || distance > 127) return; // duplicate or stale
            if (distance > 24) throw new Error("GAN Gen4 move gap too large to recover");
            if (!pending.has(entry.serial)) pending.set(entry.serial, entry.move);
            drain();
            if (pending.size) {
                const first = Math.min(...Array.from(pending.keys()).map(n => (n - lastSerial) & 255));
                request((lastSerial + first) & 255);
            }
        }

        function handle(data) {
            if (!data || data.length < 4) return false;
            if (data[0] === 0xED) {
                const serial = data[2]; // Gen4 counter is little-endian; wraps at 256.
                if (lastSerial === null) lastSerial = serial;
                else if (Date.now() - lastMoveAt > 500 && ((serial - lastSerial) & 255) > 1) request(serial);
                return true;
            }
            if (data[0] === 0x01) {
                const move = decodeMove(data);
                if (move) {
                    lastMoveAt = Date.now();
                    add(move);
                }
            } else if (data[0] === 0xD1) {
                // History is newest-first; store before draining to preserve turn order.
                const moves = decodeHistory(data);
                for (const move of moves) {
                    if (lastSerial === null) break;
                    const distance = (move.serial - lastSerial) & 255;
                    if (distance > 0 && distance <= 24 && !pending.has(move.serial)) pending.set(move.serial, move.move);
                }
                drain();
            }
            return false;
        }

        return { handle };
    }

    async function connect(device, service, twistCallback, diagnostics) {
        const mac = await findMac(device);
        const cipher = makeCipher(mac);
        const state = await service.getCharacteristic(STATE_UUID);
        const writer = await service.getCharacteristic(WRITE_UUID);
        let active = true;
        let writes = Promise.resolve();
        let readyResolve;
        let readyReject;
        const ready = new Promise((resolve, reject) => {
            readyResolve = resolve;
            readyReject = reject;
        });
        // Catch rejection even if setup fails before we start awaiting readiness.
        ready.catch(() => {});
        let initialized = false;
        let timeout;

        function send(data) {
            const task = writes.then(async () => {
                if (!active) return;
                const encoded = await cipher.encrypt(data);
                if (active) await writer.writeValue(encoded.buffer);
            });
            writes = task.catch(() => {});
            return task;
        }

        const tracker = createTracker(move => {
            if (diagnostics) diagnostics({ type: "move", move: move });
            twistCallback(move);
        }, (start, count) => {
            const request = makeCommand(0xD1);
            request[2] = start;
            request[4] = count;
            return send(request);
        });

        function onStateChanged(event) {
            if (!active) return;
            try {
                const data = cipher.decrypt(event.target.value);
                if (diagnostics) diagnostics({ type: "packet", packetType: data[0], bytes: data.length });
                const isState = tracker.handle(data);
                if (isState && !initialized) {
                    initialized = true;
                    window.clearTimeout(timeout);
                    readyResolve();
                }
            } catch (err) {
                console.warn("Invalid GAN Gen4 notification:", err);
            }
        }

        function close() {
            if (!active) return;
            active = false;
            window.clearTimeout(timeout);
            state.removeEventListener("characteristicvaluechanged", onStateChanged);
            state.stopNotifications().catch(() => {});
            if (!initialized) readyReject(new Error("GAN Gen4 disconnected during initialization"));
        }

        try {
            state.addEventListener("characteristicvaluechanged", onStateChanged);
            await state.startNotifications();
            await send(makeCommand(0xDF));       // hardware info
            await send(makeCommand(0xDD, 0xED)); // initial facelets / counter
            await send(makeCommand(0xDD, 0xEF)); // battery
            timeout = window.setTimeout(() => readyReject(
                new Error("GAN Gen4 did not return a readable cube state. Check the saved MAC address.")
            ), 5000);
            await ready;
            return { close };
        } catch (err) {
            close();
            throw err;
        }
    }

    return { SERVICE_UUID, MANUFACTURER_IDS, connect, makeCipher, createTracker, decodeMove, decodeHistory };
}());

if (typeof module !== "undefined" && module.exports) module.exports = GanV4;

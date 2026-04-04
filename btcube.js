// This is a modified version of lgarron's code from https://github.com/cubing/cuble.js
// GAN decryption is a modified version of code from https://github.com/cs0x7f/cstimer

var BtCube = (function () {
    // Used for Gikker and Mi Smart Magic Cube
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

    //Used for GoCube and Rubiks Connected    
    const GOCUBE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const GOCUBE_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
    
    // GAN MonsterGo MG3i uses this service UUID
    const MG3I_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dc4179";
    const MG3I_CHARACTERISTIC_UUID = "28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4";  // State notifications
    const MG3I_WRITE_CHARACTERISTIC_UUID = "28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4";
    const MG3I_COMPANY_IDS = [0x0001, 0x0501];
    const MG3I_MODEL_KEY = [1, 2, 66, 40, 49, 145, 22, 7, 32, 5, 24, 84, 66, 17, 18, 83];
    const MG3I_MODEL_IV = [17, 3, 50, 40, 33, 1, 118, 39, 32, 149, 120, 20, 50, 18, 2, 67];
    
    // GAN MonsterGo might use these UUIDs (to be discovered)
    const MG3I_POTENTIAL_SERVICES = [
        "6e400001-b5a3-f393-e0a9-e50e24dc4179",  // MG3i service (confirmed!)
        "0000fff0-0000-1000-8000-00805f9b34fb",  // GAN 356i service (may be reused)
        "6e400001-b5a3-f393-e0a9-e50e24dcca9e",  // GoCube service
        "00001234-0000-1000-8000-00805f9b34fb",  // Custom service
        "0000a000-0000-1000-8000-00805f9b34fb",  // Potential custom service
        "0000ffa0-0000-1000-8000-00805f9b34fb",  // Potential custom service
    ];

    var mg3iMovePatterns = {
        // These patterns are learned from observing encrypted move data
        // Format: firstByte_pattern -> move
        // This is a temporary solution until we reverse-engineer the encryption
    };
    
    var mg3iLastMove = null;
    var mg3iMoveCount = 0;
    var mg3iDecoder = null;
    var mg3iLastSeq = null;
    var mg3iWarnedUnknownPacket = false;
    var mg3iInvalidPacketCount = 0;
    var mg3iMac = null;
    var mg3iMacStorageKey = null;
    var device = null;
    async function connect(connectedCallback, twistCallback, errorCallback) {
        try {
            device = await window.navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Gi" }, { namePrefix: "Mi Smart Magic Cube" }, { namePrefix: "GAN" }, { namePrefix: "MG3i" }, { namePrefix: "GoCube_" }, { namePrefix: "Rubiks_" }],
            optionalServices: [
                GIIKER_SERVICE_UUID,
                GAN_SERVICE_UUID, GAN_SERVICE_UUID_META,
                GOCUBE_SERVICE_UUID,
                MG3I_SERVICE_UUID,  // GAN MonsterGo MG3i
                "00001800-0000-1000-8000-00805f9b34fb",  // Generic Access
                "0000180a-0000-1000-8000-00805f9b34fb",  // Device Information
                "0000fff0-0000-1000-8000-00805f9b34fb",  // GAN service
                "0000ffa0-0000-1000-8000-00805f9b34fb",  // Potential MG3i service
                "0000a000-0000-1000-8000-00805f9b34fb",  // Potential MG3i service
            ],
            optionalManufacturerData: MG3I_COMPANY_IDS
            });
            if (device.name && device.name.startsWith("MG3i")) {
                mg3iMac = await getMG3iMac(device);
            }
            var server = await device.gatt.connect();
            console.log("Connected to device: " + server.device.name);
            console.log("Device ID: " + device.id);
            console.log("Device UUIDs: " + (device.uuids ? device.uuids.join(", ") : "none"));
            
            // Add a small delay to ensure services are discoverable
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // List all available services for debugging
            try {
                console.log("Attempting to enumerate primary services...");
                var services = await server.getPrimaryServices();
                console.log("Available services: " + services.length);
                for (var i = 0; i < services.length; i++) {
                    console.log("  Service " + i + ": " + services[i].uuid);
                    try {
                        var characteristics = await services[i].getCharacteristics();
                        for (var j = 0; j < characteristics.length; j++) {
                            console.log("    Characteristic: " + characteristics[j].uuid);
                        }
                    } catch (charError) {
                        console.log("    Could not read characteristics: " + charError);
                    }
                }
            } catch (e) {
                console.log("Could not enumerate services: " + e);
                console.log("The device may not expose GATT services via Web Bluetooth API");
                
                // For MG3i, try to discover by attempting known service UUIDs
                if (server.device.name.startsWith("MG3i")) {
                    console.log("Attempting MG3i-specific discovery...");
                    for (var svcIdx = 0; svcIdx < MG3I_POTENTIAL_SERVICES.length; svcIdx++) {
                        try {
                            var svc = MG3I_POTENTIAL_SERVICES[svcIdx];
                            console.log("Trying service: " + svc);
                            var service = await server.getPrimaryService(svc);
                            console.log("Found service: " + svc);
                            var chars = await service.getCharacteristics();
                            for (var cIdx = 0; cIdx < chars.length; cIdx++) {
                                console.log("  Characteristic: " + chars[cIdx].uuid);
                            }
                        } catch (svcError) {
                            // Try next service
                        }
                    }
                }
            }
            
            if (server.device.name.startsWith("MG3i")) {
                console.log("Detected as MG3i (MonsterGo), using MG3i service UUID");
                mg3iDecoder = new MG3IDecoder(mg3iMac, MG3I_MODEL_KEY, MG3I_MODEL_IV);
                mg3iLastSeq = null;
                mg3iWarnedUnknownPacket = false;
                mg3iInvalidPacketCount = 0;
                var cubeService = await server.getPrimaryService(MG3I_SERVICE_UUID);
                console.log("Found MG3i cube service");
                
                try {
                    await cubeService.getCharacteristic(MG3I_WRITE_CHARACTERISTIC_UUID);
                    console.log("Found MG3i write characteristic");
                } catch (e1) {
                    console.log("Cannot access MG3i write characteristic: " + e1);
                }
                
                var cubeCharacteristic = await cubeService.getCharacteristic(MG3I_CHARACTERISTIC_UUID);
                console.log("Found MG3i cube characteristic, starting notifications");
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onMG3iCharacteristicChanged.bind(twistCallback));
                await cubeCharacteristic.startNotifications();
            } else if (server.device.name.startsWith("GAN")) {
                console.log("Attempting to connect as GAN device");
                ganDecoder = null;
                try {
                    var meta = await server.getPrimaryService(GAN_SERVICE_UUID_META);
                    console.log("Found metadata service");
                    var versionCharacteristic = await meta.getCharacteristic(GAN_CHARACTERISTIC_VERSION);
                    var versionValue = await versionCharacteristic.readValue();
                    var version = versionValue.getUint8(0) << 16 | versionValue.getUint8(1) << 8 | versionValue.getUint8(2);
                    console.log("Device version: " + version.toString(16));
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
                        console.log("Initialized GAN decryption");
                    } else {
                        console.log("Device version does not require decryption");
                    }
                } catch (metaError) {
                    console.log("Warning: Could not read metadata service: " + metaError);
                    console.log("Continuing without encryption...");
                }
                var cubeService = await server.getPrimaryService(GAN_SERVICE_UUID);
                console.log("Found cube service");
                var cubeCharacteristic = await cubeService.getCharacteristic(GAN_CHARACTERISTIC_UUID);
                console.log("Found cube characteristic, starting polling");
                onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback);
            } else if (server.device.name.startsWith("Gi") || server.device.name.startsWith("Mi Smart Magic Cube")) {
                var cubeService = await server.getPrimaryService(GIIKER_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GIIKER_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGiikerCubeCharacteristicChanged.bind(twistCallback));
                await cubeCharacteristic.startNotifications();
            } else if (server.device.name.startsWith("GoCube_") || server.device.name.startsWith("Rubiks_")) {
                var cubeService = await server.getPrimaryService(GOCUBE_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GOCUBE_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGoCubeCharacteristicChanged.bind(twistCallback));
                await cubeCharacteristic.startNotifications();
            } else {
                // Try to detect by service UUID as fallback for unknown device names
                console.log("Device name not recognized, trying service-based detection");
                try {
                    var ganService = await server.getPrimaryService(GAN_SERVICE_UUID);
                    console.log("Detected as GAN device by service UUID");
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
                    var cubeCharacteristic = await ganService.getCharacteristic(GAN_CHARACTERISTIC_UUID);
                    onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback);
                } catch (e) {
                    console.log("Failed to detect by GAN service, trying other services: " + e);
                    try {
                        var gikerService = await server.getPrimaryService(GIIKER_SERVICE_UUID);
                        console.log("Detected as Giiker device by service UUID");
                        var cubeCharacteristic = await gikerService.getCharacteristic(GIIKER_CHARACTERISTIC_UUID);
                        cubeCharacteristic.addEventListener("characteristicvaluechanged", onGiikerCubeCharacteristicChanged.bind(twistCallback));
                        await cubeCharacteristic.startNotifications();
                    } catch (e2) {
                        console.log("Failed to detect by Giiker service: " + e2);
                        try {
                            var gocubeService = await server.getPrimaryService(GOCUBE_SERVICE_UUID);
                            console.log("Detected as GoCube device by service UUID");
                            var cubeCharacteristic = await gocubeService.getCharacteristic(GOCUBE_CHARACTERISTIC_UUID);
                            cubeCharacteristic.addEventListener("characteristicvaluechanged", onGoCubeCharacteristicChanged.bind(twistCallback));
                            await cubeCharacteristic.startNotifications();
                        } catch (e3) {
                            throw "Unknown device: " + server.device.name + " (tried GAN, Giiker, and GoCube services, none found)";
                        }
                    }
                }
            }

            device.addEventListener('gattserverdisconnected', disconnected.bind(errorCallback));
            connectedCallback();
        } catch (ex) {
            console.error("Connection error: " + ex);
            console.error("Full error: ", ex);
            device = null;
            errorCallback(ex);
        }
    }

    function disconnected() {
        device = null;
        mg3iDecoder = null;
        mg3iLastSeq = null;
        mg3iMac = null;
        mg3iMacStorageKey = null;
        mg3iInvalidPacketCount = 0;
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
    
    function onMG3iCharacteristicChanged(event) {
        try {
            var val = event.target.value;
            if (!mg3iDecoder) {
                throw new Error("MG3i decoder is not initialized");
            }
            var decoded = mg3iDecoder.decrypt(val);
            var messageType = extractBits(0, 0, 4, 1, decoded)[0];
            if (messageType != 2) {
                mg3iInvalidPacketCount++;
                if (!mg3iWarnedUnknownPacket) {
                    mg3iWarnedUnknownPacket = true;
                    console.log("MG3i ignoring packet type " + messageType);
                }
                if (mg3iInvalidPacketCount >= 3) {
                    replaceMG3iMac();
                }
                return;
            }
            mg3iInvalidPacketCount = 0;
            var seq = extractBits(0, 4, 8, 1, decoded)[0];
            var moveIds = extractBits(1, 4, 5, 7, decoded);
            if (mg3iLastSeq == null) {
                mg3iLastSeq = seq;
                return;
            }
            var missed = (seq - mg3iLastSeq) & 0xff;
            mg3iLastSeq = seq;
            if (missed == 0) return;
            if (missed > 6) {
                console.warn("MG3i dropped too many moves, resyncing at sequence " + seq);
                return;
            }
            for (var i = missed - 1; i >= 0; i--) {
                var twist = mg3iMoveIdToNotation(moveIds[i]);
                if (twist) {
                    this(twist);
                }
            }
        } catch (ex) {
            console.error("ERROR (MG3i): " + ex.message);
        }
    }

    async function getMG3iMac(dev) {
        var key = "mg3i-mac:" + (dev.id || dev.name || "default");
        mg3iMacStorageKey = key;
        var mac = window.localStorage.getItem(key);
        if (isValidMG3iMac(mac)) {
            return normalizeMG3iMac(mac);
        }
        try {
            mac = await waitForMG3iAdvertisements(dev);
        } catch (ex) {
            console.log("MG3i auto-detection unavailable, falling back to manual MAC entry: " + ex.message);
            mac = promptForMG3iMac();
        }
        if (isValidMG3iMac(mac)) {
            mac = normalizeMG3iMac(mac);
            window.localStorage.setItem(key, mac);
            return mac;
        }
        throw new Error("Could not infer MG3i MAC from Bluetooth advertisements");
    }

    function replaceMG3iMac() {
        var previousMac = mg3iMac;
        try {
            if (mg3iMacStorageKey) {
                window.localStorage.removeItem(mg3iMacStorageKey);
            }
            alert("The saved MG3i MAC address appears to be wrong. Please enter it again.");
            mg3iMac = promptForMG3iMac();
            if (mg3iMacStorageKey) {
                window.localStorage.setItem(mg3iMacStorageKey, mg3iMac);
            }
            mg3iDecoder = new MG3IDecoder(mg3iMac, MG3I_MODEL_KEY, MG3I_MODEL_IV);
            mg3iLastSeq = null;
            mg3iWarnedUnknownPacket = false;
            mg3iInvalidPacketCount = 0;
            console.log("MG3i MAC updated");
        } catch (ex) {
            mg3iMac = previousMac;
            throw ex;
        }
    }

    function promptForMG3iMac() {
        while (true) {
            var mac = window.prompt(
                "MAC address (xx:xx:xx:xx:xx:xx) of your cube.\n" +
                "It can usually be found in CubeStation or chrome://bluetooth-internals/#devices."
            );
            if (mac == null) {
                throw new Error("User cancelled");
            }
            mac = normalizeMG3iMac(mac);
            if (isValidMG3iMac(mac)) {
                return mac;
            }
            alert("Invalid MG3i MAC address. Use six hex byte pairs, for example AA:BB:CC:DD:EE:FF.");
        }
    }

    function getMG3iManufacturerDataBytes(manufacturerData) {
        if (manufacturerData instanceof DataView) {
            return manufacturerData;
        }
        if (!manufacturerData) {
            return null;
        }
        for (var i = 0; i < MG3I_COMPANY_IDS.length; i++) {
            var companyId = MG3I_COMPANY_IDS[i];
            if (manufacturerData.has && manufacturerData.has(companyId)) {
                return manufacturerData.get(companyId);
            }
        }
        return null;
    }

    function waitForMG3iAdvertisements(dev) {
        if (!dev.watchAdvertisements) {
            return Promise.reject(new Error("Browser does not support Bluetooth advertisement watching for MG3i auto-detection"));
        }
        return new Promise(function(resolve, reject) {
            var timeoutId = null;
            var onAdvertisement = function(event) {
                try {
                    var dataView = getMG3iManufacturerDataBytes(event.manufacturerData);
                    if (!dataView || dataView.byteLength < 6) {
                        return;
                    }
                    var macBytes = [];
                    for (var i = 0; i < 6; i++) {
                        macBytes.push((dataView.getUint8(dataView.byteLength - i - 1) + 0x100).toString(16).slice(1));
                    }
                    cleanup();
                    resolve(macBytes.join(":").toUpperCase());
                } catch (ex) {
                    cleanup();
                    reject(ex);
                }
            };
            function cleanup() {
                dev.removeEventListener("advertisementreceived", onAdvertisement);
                if (dev.unwatchAdvertisements) {
                    dev.unwatchAdvertisements();
                }
                if (timeoutId != null) {
                    window.clearTimeout(timeoutId);
                }
            }
            dev.addEventListener("advertisementreceived", onAdvertisement);
            dev.watchAdvertisements().catch(function(ex) {
                cleanup();
                reject(ex);
            });
            timeoutId = window.setTimeout(function() {
                cleanup();
                reject(new Error("Timed out while waiting for MG3i advertisements"));
            }, 5000);
        });
    }

    function normalizeMG3iMac(mac) {
        if (!mac) return "";
        mac = mac.trim().toUpperCase().replace(/[^0-9A-F]/g, "");
        if (mac.length != 12) return "";
        return mac.match(/.{2}/g).join(":");
    }

    function isValidMG3iMac(mac) {
        return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac || "");
    }

    function extractBits(byteIndex, bitIndex, bitLength, count, view, highToLow) {
        if (highToLow === undefined) highToLow = true;
        var extracted = 0;
        var values = [];
        while (byteIndex < view.byteLength) {
            var currentLength = 0;
            var value = 0;
            while (currentLength < bitLength && byteIndex < view.byteLength) {
                var byteBits = 8 - bitIndex;
                var targetLength = Math.min(currentLength + byteBits, bitLength);
                var copyLength = targetLength - currentLength;
                var rightShift = byteBits - copyLength;
                var chunk;
                if (highToLow) {
                    chunk = ((view.getUint8(byteIndex) & bitMask(bitIndex)) >> rightShift) << (bitLength - targetLength);
                } else {
                    chunk = ((view.getUint8(byteIndex) & bitMask(bitIndex)) >> rightShift) << currentLength;
                }
                value += chunk;
                currentLength += copyLength;
                bitIndex += copyLength;
                if (rightShift == 0) {
                    byteIndex++;
                    bitIndex = 0;
                }
                if (currentLength == bitLength) {
                    values.push(value);
                    extracted++;
                    break;
                }
            }
            if (count > 0 && extracted >= count) break;
        }
        return values;
    }

    function bitMask(bitIndex, totalBits) {
        if (totalBits === undefined) totalBits = 8;
        var bits = Math.min(totalBits - bitIndex, 31);
        var mask = 0;
        for (var i = 0; i < bits; i++) {
            mask += Math.pow(2, i);
        }
        return mask;
    }

    function mg3iMoveIdToNotation(moveId) {
        return {
            0: "U",
            1: "U'",
            2: "R",
            3: "R'",
            4: "F",
            5: "F'",
            6: "D",
            7: "D'",
            8: "L",
            9: "L'",
            10: "B",
            11: "B'"
        }[moveId] || null;
    }

    function MG3IDecoder(mac, modelKey, modelIV) {
        this.modelIV = modelIV.slice();
        this.deviceIV = modelIV.slice();
        var macBytes = mac.split(":");
        if (macBytes.length != 6) {
            throw new Error("Expected MG3i MAC to have 6 bytes");
        }
        this.aes = new aes128(deriveMG3iKey(macBytes, modelKey));
        for (var i = 0; i < 6; i++) {
            this.deviceIV[i] = (modelIV[i] + parseInt(macBytes[5 - i], 16)) % 255;
        }
    }

    function deriveMG3iKey(macBytes, modelKey) {
        var key = modelKey.slice();
        for (var i = 0; i < 6; i++) {
            key[i] = (key[i] + parseInt(macBytes[5 - i], 16)) % 255;
        }
        return key;
    }

    MG3IDecoder.prototype.decryptBlock = function(block, iv) {
        var decrypted = this.aes.decrypt(block.slice());
        for (var i = 0; i < 16; i++) {
            decrypted[i] ^= iv[i];
        }
        return decrypted;
    };

    MG3IDecoder.prototype.decrypt = function(dataView) {
        var bytes = [];
        for (var i = 0; i < dataView.byteLength; i++) {
            bytes.push(dataView.getUint8(i));
        }
        var decoded;
        if (bytes.length > 16) {
            decoded = bytes.slice();
            var lastBlock = this.decryptBlock(decoded.slice(decoded.length - 16), this.deviceIV);
            for (var j = 0; j < 16; j++) {
                decoded[decoded.length - 16 + j] = lastBlock[j];
            }
            var firstBlock = this.decryptBlock(decoded.slice(0, 16), this.deviceIV);
            for (var k = 0; k < 16; k++) {
                decoded[k] = firstBlock[k];
            }
        } else {
            decoded = this.decryptBlock(bytes, this.modelIV);
        }
        return new DataView(new Uint8Array(decoded).buffer);
    };

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

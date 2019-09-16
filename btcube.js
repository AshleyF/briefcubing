// This is a modified version of lgarron's code from https://github.com/cubing/cuble.js

var BtCube = (function () {
    const GIIKER_SERVICE_UUID = "0000aadb-0000-1000-8000-00805f9b34fb";
    const GIIKER_CHARACTERISTIC_UUID = "0000aadc-0000-1000-8000-00805f9b34fb";

    const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
    const GAN_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";

    const GOCUBE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const GOCUBE_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

    var device;

    async function connect(connectedCallback, twistCallback, errorCallback) {
        try {
            device = await window.navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Gi" }, { namePrefix: "GAN-" }, { namePrefix: "GoCube_" }],
            optionalServices: [
                GIIKER_SERVICE_UUID,
                GAN_SERVICE_UUID,
                GOCUBE_SERVICE_UUID,
                "device_information"
            ]
            });
            var server = await device.gatt.connect();
            if (server.device.name.startsWith("GAN-")) {
                var hwVersion =
                    await server.getPrimaryService("device_information")
                    .then(info => info.getCharacteristic('hardware_revision_string'))
                    .then(hw => hw.readValue());
                var major = hwVersion.getUint8(0);
                var minor = hwVersion.getUint8(1);
                var patch = hwVersion.getUint8(2)
                if (major <= 3 && minor <= 1) {
                    // initial China release (JUN 2019)
                    var cubeService = await server.getPrimaryService(GAN_SERVICE_UUID);
                    var cubeCharacteristic = await cubeService.getCharacteristic(GAN_CHARACTERISTIC_UUID);
                    onPollGanCubeCharacteristic(cubeCharacteristic, twistCallback);
                } else {
                    // later US Nationals release (AUG 2019)
                    alert("The newest GAN 356i hardware (released at US Nationals in August 2019) is not yet supported. Please check back later and follow us on facebook.com/briefcubing for updates.");
                    errorCallback()
                }
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
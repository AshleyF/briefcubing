// This is a modified version of lgarron's code from https://github.com/cubing/cuble.js

var BtCube = (function () {
    const GIIKER_SERVICE_UUID = "0000aadb-0000-1000-8000-00805f9b34fb";
    const GIIKER_CHARACTERISTIC_UUID = "0000aadc-0000-1000-8000-00805f9b34fb";

    const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
    const GAN_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";

    var device;

    async function connect(connectedCallback, twistCallback, errorCallback) {
        try {
            device = await window.navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Gi" }, { namePrefix: "GAN-" }],
            optionalServices: [
                GIIKER_SERVICE_UUID,
                GAN_SERVICE_UUID
            ]
            });
            var server = await device.gatt.connect();
            if (server.device.name.startsWith("GAN-")) {
                var cubeService = await server.getPrimaryService(GAN_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GAN_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGanCubeCharacteristicChanged.bind(twistCallback));
                cubeCharacteristic.readValue();
            } else if (server.device.name.startsWith("Gi")) {
                var cubeService = await server.getPrimaryService(GIIKER_SERVICE_UUID);
                var cubeCharacteristic = await cubeService.getCharacteristic(GIIKER_CHARACTERISTIC_UUID);
                cubeCharacteristic.addEventListener("characteristicvaluechanged", onGiikerCubeCharacteristicChanged.bind(twistCallback));
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
            for (var i = 0; i < 20; i++) {
                state.push(Math.floor(val.getUint8(i) / 16));
                state.push(val.getUint8(i) % 16);
            }
            var face = state[32];
            var amount = state[33];
            this(["?", "B", "D", "L", "U", "R", "F"][face] + ["", "", "2", "'"][amount == 9 ? 2 : amount]); // twistCallback
        } catch (ex) {
            alert("ERROR: " + ex.message);
        }
    }

    var lastCount = -1;
    function onGanCubeCharacteristicChanged(event) {
        try {
            var val = event.target.value;
            const twists = ["U", "?", "U'", "R", "?", "R'", "F", "?", "F'", "D", "?", "D'", "L", "?", "L'", "B", "?", "B'"]
            var count = val.getUint8(12);
            if (lastCount == -1) lastCount = count;
            if (count != lastCount) {
                var missed = (count - lastCount) & 0xff;
                lastCount = count;
                for (var i = 19 - missed; i < 19; i++) {
                    var t = val.getUint8(i);
                    this(twists[t]);
                }
            }
            event.target.readValue(); // TODO: delay
        } catch (ex) {
            alert("ERROR: " + ex.message);
        }
    }

    return {
        connect: connect,
        connected: connected,
        disconnect: disconnect
    };
}());
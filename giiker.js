// This is a modified version of lgarron's giiker.js from https://github.com/cubing/cuble.js

var Giiker = (function () {
    const SERVICE_UUID = "0000aadb-0000-1000-8000-00805f9b34fb";
    const CHARACTERISTIC_UUID = "0000aadc-0000-1000-8000-00805f9b34fb";

    const SYSTEM_SERVICE_UUID = "0000aaaa-0000-1000-8000-00805f9b34fb";
    const SYSTEM_READ_UUID = "0000aaab-0000-1000-8000-00805f9b34fb";
    const SYSTEM_WRITE_UUID = "0000aaac-0000-1000-8000-00805f9b34fb";

    function giikerTwist(i, giikerState) {
        var twists = "BDLURF";
        var twist = giikerState[32 + i * 2] - 1;
        var amount = giikerState[32 + 1 + i * 2];
        return twists[twist] + (amount == 2 ? "2" : amount == 3 ? "'" : "");
    }

    var device;

    async function connect(connectedCallback, twistCallback, errorCallback) {
        try {
            console.log("Attempting to pair.")
            device = await navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: "GiC"
            }],
            optionalServices: [
                SERVICE_UUID,
                "00001530-1212-efde-1523-785feabcd123",
                "0000aaaa-0000-1000-8000-00805f9b34fb",
                "0000180f-0000-1000-8000-00805f9b34fb",
                "0000180a-0000-1000-8000-00805f9b34fb"
            ]
            });
            console.log("Device:", device);
            var server = await device.gatt.connect();
            console.log("Server:", server);
            var cubeService = await server.getPrimaryService(SERVICE_UUID);
            console.log("Service:", cubeService);
            var cubeCharacteristic = await cubeService.getCharacteristic(CHARACTERISTIC_UUID);
            console.log(cubeCharacteristic);
            // TODO: Can we safely save the async promise instead of waiting for the response?
            var originalValue = await cubeCharacteristic.readValue();
            cubeCharacteristic.addEventListener("characteristicvaluechanged", onCubeCharacteristicChanged.bind(twistCallback));
            device.addEventListener('gattserverdisconnected', disconnected.bind(errorCallback));
            await cubeCharacteristic.startNotifications();
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
    function onCubeCharacteristicChanged(event) {
        try {
            if (first) {
                first = false;
                return; // skip first event
            }
            var val = event.target.value;
            console.log(val);
            console.log(event);
            var giikerState = [];
            for (var i = 0; i < 20; i++) {
                giikerState.push(Math.floor(val.getUint8(i) / 16));
                giikerState.push(val.getUint8(i) % 16);
            }
            var str = "";
            str += giikerState.slice(0, 8).join(".");
            str += "\n"
            str += giikerState.slice(8, 16).join(".");
            str += "\n"
            str += giikerState.slice(16, 28).join(".");
            str += "\n"
            str += giikerState.slice(28, 32).join(".");
            str += "\n"
            str += giikerState.slice(32, 40).join(".");
            console.log(str);

            var face = giikerState[32];
            var amount = giikerState[33];
            this(["?", "B", "D", "L", "U", "R", "F"][face] + ["", "", "2", "'"][amount == 9 ? 2 : amount]); // twistCallback
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
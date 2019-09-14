const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const GAN_STATE_CHARACTERISTIC_UUID = "0000fff2-0000-1000-8000-00805f9b34fb";
const GAN_POSE_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";

async function connect()
{
    try
    {
        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [GAN_SERVICE_UUID] });
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });
        var server = await device.gatt.connect();
        var service = await server.getPrimaryService(GAN_SERVICE_UUID);
        var stateCharacteristic = await service.getCharacteristic(GAN_STATE_CHARACTERISTIC_UUID);
        var poseCharacteristic = await service.getCharacteristic(GAN_POSE_CHARACTERISTIC_UUID);
        poll(stateCharacteristic, poseCharacteristic);
    }
    catch (ex)
    {
        alert("ERROR: " + ex);
    }
}

async function poll(stateCharacteristic, poseCharacteristic) {
    try {
        var ignore = await poseCharacteristic.readValue(); // without this, the state (next) doesn't update?
        var state = await stateCharacteristic.readValue();
        var stickers = "";
        for (var i = 17; i > 0; i -= 3) {
            var v = state.getUint8((i - 2) ^ 1) << 16 | state.getUint8((i - 1) ^ 1) << 8 | state.getUint8(i ^ 1);
            console.log(v);
            for (var j = 0; j < 8; j++) {
                stickers = ['W', 'R', 'G', 'Y', 'O', 'B'][v & 7] + stickers;
                v >>= 3
            }
        }
        document.getElementById("log").innerText = stickers;
        window.setTimeout(async function() { await poll(stateCharacteristic, poseCharacteristic); }, 1);
    } catch (ex) {
        alert("ERROR (G): " + ex.message);
    }
}
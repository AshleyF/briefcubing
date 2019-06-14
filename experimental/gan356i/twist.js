const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const GAN_STATE_CHARACTERISTIC_UUID = "0000fff2-0000-1000-8000-00805f9b34fb";
const GAN_POSE_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";
const GAN_ENCODERS_CHARACTERISTIC_UUID = "0000fff7-0000-1000-8000-00805f9b34fb";

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
        var encodersCharacteristic = await service.getCharacteristic(GAN_ENCODERS_CHARACTERISTIC_UUID);
        poll(stateCharacteristic, poseCharacteristic, encodersCharacteristic);
    }
    catch (ex)
    {
        alert("ERROR: " + ex);
    }
}

var initial = undefined;
async function poll(stateCharacteristic, poseCharacteristic, encodersCharacteristic) {
    try {
        // state
        var state = await stateCharacteristic.readValue();
        var count = state.getUint8(18);
        var stickers = [];
        for (var i = 17; i > 0; i -= 3) {
            var v = state.getUint8((i - 2) ^ 1) << 16 | state.getUint8((i - 1) ^ 1) << 8 | state.getUint8(i ^ 1);
            for (var j = 0; j < 8; j++) {
                stickers.unshift(v & 7);
                v >>= 3
            }
        }
        document.getElementById("log").innerText = JSON.stringify(stickers);

        // pose
        var pose = await poseCharacteristic.readValue();
        var xr = pose.getInt16(0, true);
        var yr = pose.getInt16(2, true);
        var zr = pose.getInt16(4, true);

        // infer quaternion w
        var x = xr / 16384; // * Math.PI;
        var y = yr / 16384; // * Math.PI;
        var z = zr / 16384; // * Math.PI;
        var ww = 1 - (x * x + y * y + z * z);
        var w = ww > 0 ? Math.sqrt(ww) : 0;

        var e = toEuler(w, x, y, z);

        // encoders
        var encoders = await encodersCharacteristic.readValue();
        var u = encoders.getUint8(0);
        var r = encoders.getUint8(1);
        var f = encoders.getUint8(2);
        var d = encoders.getUint8(3);
        var l = encoders.getUint8(4);
        var b = encoders.getUint8(5);

        update(e.x, e.y, e.z, u, r, f, d, l, b)
        window.setTimeout(async function() { await poll(stateCharacteristic, poseCharacteristic, encodersCharacteristic); }, 1);
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

function update(x, y, z, u, r, f, d, l, b) {
    document.getElementById("pose").innerHTML = "<b>Euler:</b><br />x: " + x + "<br />y: " + y + "<br />z: " + z + "<br />";
    document.getElementById("encoders").innerHTML = "U: " + u + "<br />R: " + r + "<br />F: " + f + "<br />D: " + d + "<br />L: " + l + "<br />B: " + b;
    /*
    var entry = document.createElement("div");
    entry.innerText = new Date().getTime() + "," + x + "," + y + "," + z + "," + u + "," + r + "," + f + "," + d + "," + l + "," + b;
    document.getElementById("log").appendChild(entry);
    */
}
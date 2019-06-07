async function connect()
{
    try
    {
        const GAN_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
        const GAN_CHARACTERISTIC_UUID = "0000fff5-0000-1000-8000-00805f9b34fb";
        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [GAN_SERVICE_UUID] });
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });
        var server = await device.gatt.connect();
        var service = await server.getPrimaryService(GAN_SERVICE_UUID);
        var characteristic = await service.getCharacteristic(GAN_CHARACTERISTIC_UUID);
        pollCharacteristic(characteristic);
    }
    catch (ex)
    {
        alert("ERROR: " + ex);
    }
}

var initial = undefined;
async function pollCharacteristic(cubeCharacteristic) {
    try {
        var value = await characteristics[4].readValue();

        // pose
        var x = value.getInt16(0, true);
        var y = value.getInt16(2, true);
        var z = value.getInt16(4, true);
        var htm = "<b>Raw:</b><br />x: " + Math.round(x) + "<br />y: " + Math.round(y) + "<br />z: " + Math.round(z) + "<br />";

        // convert angles
        var xr = x / 32768 * 2 * Math.PI;
        var yr = y / 32768 * 2 * Math.PI;
        var zr = z / 32768 * 2 * Math.PI;
        htm += "<b>Radians:</b><br />x: " + xr + "<br />y: " + yr + "<br />z: " + zr + "<br />";

        if (!initial) {
            initial = toQuaternion(xr, yr, zr);
        }

        var current = toQuaternion(xr, yr, zr);
        var diff = {
            w: current.w - initial.w,
            x: current.x - initial.x,
            y: current.y - initial.y,
            z: current.z - initial.z };
        var d = toEuler(diff.w, diff.x, diff.y, diff.z);
        htm += "<b>Diff:</b><br />x: " + d.x + "<br />y: " + d.y + "<br />z: " + d.z + "<br />";

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

        window.setTimeout(async function() { await pollCharacteristic(characteristic); }, 50);
    } catch (ex) {
        alert("ERROR (G): " + ex.message);
    }
}

// https://github.com/infusion/Quaternion.js/blob/master/quaternion.js

function toQuaternion(x, y, z) {
    var xh = x * 0.5;
    var yh = y * 0.5;
    var zh = z * 0.5;
    var cx = Math.cos(xh);
    var cy = Math.cos(yh);
    var cz = Math.cos(zh);
    var sx = Math.sin(xh);
    var sy = Math.sin(yh);
    var sz = Math.sin(zh);
    return {
        w: cx * cy * cz - sx * sy * sz,
        x: sx * cy * cz + cx * sy * sz,
        y: cx * sy * cz - sx * cy * sz,
        z: cx * cy * sz + sx * sy * cz }
}

// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles

function toEuler(w, x, y, z) {
	var sp = 2 * (w * y - z * x);
    return {
        x: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
        y: Math.asin(sp) * (Math.abs(sp) < 1 ? 1 : Math.PI / 2),
        z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) }
}
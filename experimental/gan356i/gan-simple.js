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
        var value = await cubeCharacteristic.readValue();

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
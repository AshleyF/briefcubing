async function connect()
{
    try
    {
        const GIIKER_SERVICE_UUID = "0000aadb-0000-1000-8000-00805f9b34fb";
        const GIIKER_CHARACTERISTIC_UUID = "0000aadc-0000-1000-8000-00805f9b34fb";

        console.log("Attempting to pair.")
        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "Gi" }], optionalServices: [GIIKER_SERVICE_UUID] });

        console.log("Device: ", device);
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });

        var server = await device.gatt.connect();
        console.log("Server: ", server);

        var service = await server.getPrimaryService(GIIKER_SERVICE_UUID);
        console.log("Service: ", service);

        var characteristic = await service.getCharacteristic(GIIKER_CHARACTERISTIC_UUID);
        characteristic.addEventListener("characteristicvaluechanged", onGiikerCubeCharacteristicChanged);
        await characteristic.startNotifications();
    }
    catch (ex)
    {
        console.log("ERROR: ", ex);
        alert("ERROR: " + ex);
    }
}

var first = true;
function onGiikerCubeCharacteristicChanged(event) {
    try {
        var value = event.target.value;
        var len = value.byteLength;
        var bytes = [];
        for (var k = 0; k < len; k++)
        {
            var b = value.getUint8(k);
            bytes.push(b);
        }
        var report = "";
        var htm = "<table width='100%'><tr><td colspan='" + len + "'>" + event.target.uuid + "</td></tr><tr>";
        if (value.getUint8(18) == 0xa7) { // decrypt
            var key = [176, 81, 104, 224, 86, 137, 237, 119, 38, 26, 193, 161, 210, 126, 150, 81, 93, 13, 236, 249, 89, 235, 88, 24, 113, 81, 214, 131, 130, 199, 2, 169, 39, 165, 171, 41];
            var kk = value.getUint8(19);
            var k1 = kk >> 4 & 0xf;
            var k2 = kk & 0xf;
            for (var k = 0; k < len; k++)
            {
                var b = value.getUint8(k);
                b = (b + key[k + k1] + key[k + k2]) & 0xff;
                report += b >> 4 & 0xf + " ";
                report += b & 0xf + " ";
                htm += "<td width='" + Math.round(100 / (len * 2)) + "%' align='center'>" + (b >> 4 & 0xf) + "</td>";
                htm += "<td width='" + Math.round(100 / (len * 2)) + "%' align='center'>" + (b & 0xf) + "</td>";
            }
        }
        else
        {
            for (var k = 0; k < len; k++)
            {
                var b = value.getUint8(k);
                report += b + " ";
                htm += "<td width='" + Math.round(100 / len) + "%' align='center'>" + b + "</td>";
            }
        }
        console.log("Report: " + report);
        htm += "</tr></table>"
        document.getElementById("raw").innerHTML = htm;
    } catch (ex) {
        alert("ERROR (K): " + ex.message);
    }
}
/*
            var state = [];
            for (var i = 0; i < 20; i++) {
                state.push(Math.floor(val.getUint8(i) / 16));
                state.push(val.getUint8(i) % 16);
            }
            var face = state[32];
            var amount = state[33];
            this(["?", "B", "D", "L", "U", "R", "F"][face] + ["", "", "2", "'"][amount == 9 ? 2 : amount]); // twistCallback
*/
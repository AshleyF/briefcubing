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
        for (var k = 0; k < len; k++)
        {
            var b = value.getUint8(k);
            report += b + " ";
            htm += "<td width='" + Math.round(100 / len) + "%' align='center'>" + b + "</td>";
        }
        console.log("Report: " + report);
        htm += "</tr></table>"
        document.getElementById("raw").innerHTML = htm;
    } catch (ex) {
        alert("ERROR (K): " + ex.message);
    }
}
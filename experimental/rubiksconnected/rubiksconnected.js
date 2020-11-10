async function connect()
{
    try
    {
        const RUBIKS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
        const RUBIKS_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

        device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "Rubiks_" }], optionalServices: [RUBIKS_SERVICE_UUID] });
        console.log("Device: ", device);
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });

        var server = await device.gatt.connect();
        console.log("Server: ", server);

        var service = await server.getPrimaryService(RUBIKS_SERVICE_UUID);
        console.log("Service: ", service);

        var characteristics = await service.getCharacteristics(RUBIKS_CHARACTERISTIC_UUID);
        characteristics[0].addEventListener("characteristicvaluechanged", characteristicNotification);
        await characteristics[0].startNotifications();
    } catch (ex) {
        alert("ERROR: " + ex.message);
    }
}

function characteristicNotification(event) {
    try {
        var value = event.target.value;
        var len = value.byteLength;
        var bytes = [];
        for (var k = 0; k < len; k++)
        {
            var b = value.getUint8(k);
            bytes.push(b);
        }
        document.getElementById("raw").innerText = bytes;
        console.log("Data: ", bytes);

        if (bytes[0] == 42 && bytes[1] == 6)
        {
            document.getElementById("turns").innerText = bytes;
        }
    } catch (ex) {
        alert("ERROR: " + ex.message);
    }
}
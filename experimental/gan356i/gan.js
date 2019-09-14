async function connect()
{
    try
    {
        console.log("Attempting to pair.")
        const PRIMARY_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";

        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [PRIMARY_UUID, "device_information"] });

        console.log("Device: ", device);
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });

        var server = await device.gatt.connect();
        console.log("Server: ", server);

        var service = await server.getPrimaryService(PRIMARY_UUID);
        console.log("Service: ", service);

        var hwVersion = await server.getPrimaryService("device_information")
                                    .then(info => info.getCharacteristic('hardware_revision_string'))
                                    .then(hw => hw.readValue());
        var major = hwVersion.getUint8(0);
        var minor = hwVersion.getUint8(1);
        var patch = hwVersion.getUint8(2);
        document.getElementById("info").innerText = "Hardware Version: " + major + "." + minor + "." + patch + " (" + (major <= 3 && minor <= 1 ? "OLD" : "NEW") + ")";

        var characteristics = await service.getCharacteristics();
        console.log(characteristics);

        for (var i in characteristics)
        {
            var c = characteristics[i];
            console.log("Characteristic: ", c);

            var descriptors = await c.getDescriptors();
            for (var j in descriptors)
            {
                var d = descriptors[j];
                console.log("  Descriptor: ", d);
            }

            if (c.properties.read || c.properties.notify)
            {
                var htm = document.createElement("div");
                htm.id = c.uuid;
                document.getElementById("raw").appendChild(htm);
                c.addEventListener('characteristicvaluechanged', event =>
                {
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
                    if (event.target.uuid.startsWith("0000fff2")) {
                        console.log("Report: " + report);
                    }
                    htm += "</tr></table>"
                    document.getElementById(event.target.uuid).innerHTML = htm;
                    event.target.readValue();
                });
                if (c.properties.read)
                {
                    c.readValue();
                }
                if (c.properties.notify)
                {
                    c.addEventListener('characteristicvaluechanged', event =>
                    {
                        var value = event.target.value;
                    });
                    c.startNotifications();
                }
            }
        }

        // pose
        characteristics[4].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var x = value.getInt16(0, true);
            var y = value.getInt16(2, true);
            var z = value.getInt16(4, true);
            document.getElementById("pose").innerHTML = "x: " + x + "<br />y: " + y + "<br />z: " + z;
        });

        // encoders
        characteristics[6].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var sides = "URFDLB";
            var htm = "";
            for (var i = 0; i < 6; i++)
            {
                htm += sides[i] + ": " + value.getUint8(i) + "<br />";
            }
            document.getElementById("encoders").innerHTML = htm;
        });

        // twists (last 6 bytes of characteristic 3 seems like the same thing...)
        characteristics[2].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var twists = ["U", "?", "U'", "R", "?", "R'", "F", "?", "F'", "D", "?", "D'", "L", "?", "L'", "B", "?", "B'"]
            var htm = "Count: " + value.getUint8(0) + "<br />";
            for (var i = 1; i < 19; i++)
            {
                htm += twists[value.getUint8(i)] + " ";
            }
            document.getElementById("twists").innerHTML = htm;
        });
    }
    catch (ex)
    {
        console.log("ERROR: ", ex);
        alert("ERROR: " + ex);
    }
}
async function connect()
{
    try
    {
        const PRIMARY_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [PRIMARY_UUID] });
        device.addEventListener("gattserverdisconnected", event => { alert("Disconnected!"); });
        var server = await device.gatt.connect();
        var service = await server.getPrimaryService(PRIMARY_UUID);
        var characteristics = await service.getCharacteristics();
        var xs = [];
        var ys = [];
        var zs = [];
        var count = 0;
        characteristics[4].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;

            // pose
            var x = value.getInt16(0, true);
            var y = value.getInt16(2, true);
            var z = value.getInt16(4, true);
            xs.push(x);
            ys.push(y);
            zs.push(z);
            if (count++ > 100)
            {
                xs.shift();
                ys.shift();
                zs.shift();
                count--;
            }
            var ax = 0;
            var ay = 0;
            var az = 0;
            for (var i = 0; i < count; i++)
            {
                ax += xs[i];
                ay += ys[i];
                az += zs[i];
            }
            ax /= count;
            ay /= count;
            az /= count;
            document.getElementById("pose").innerHTML = "x: " + Math.round(ax) + "<br />y: " + Math.round(ay) + "<br />z: " + Math.round(az);

            // encoders
            var sides = "URFDLB";
            var htm = "";
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

            event.target.readValue();
        });
        characteristics[4].readValue();
    }
    catch (ex)
    {
        alert("ERROR: " + ex);
    }
}
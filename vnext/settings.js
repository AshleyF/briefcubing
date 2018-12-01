var Settings = (function () {

    const VERSION = 1;

    var settings = { // defaults
        version: VERSION,
        randomAuf: true,
        upColors: { yellow: true, red: true, blue: false },
        algs: ["all_edges1", "all_edges2", "all_edges3", "all_edges4", "all_edges5", "all_edges6", "all_edges7"],
        lang: "en"
    };
    if (localStorage.settings) {
        var stored = JSON.parse(localStorage.settings);
        if (stored && stored.version && stored.version == VERSION) {
            switch (stored.version) {
                case 1: // accept version 1
                    settings = stored;
                    break;
                default: return; // discard unknown version
            }
        }
    }

    function saveSettings() {
        localStorage.settings = JSON.stringify(settings);
    }

    function deleteSettings() {
        localStorage.removeItem("settings");
    }

    return {
        values: settings,
        save: saveSettings,
        delete: deleteSettings };
}());
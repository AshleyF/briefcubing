var Settings = (function () {

    const VERSION = 2;

    var settings = { // defaults
        version: VERSION,
        randomAuf: true,
        randomOrder: false,
        upColors: { yellow: true, red: true, blue: false },
        algs: ["cmll_s_left_bar"],
        algAufPrefs: {},
        timeout: 3,
        lang: "en"
    };
    if (localStorage.settings) {
        var stored = JSON.parse(localStorage.settings);
        if (stored) {
            switch (stored.version) {
                case 1: // migrate to version 2
                    stored.version = VERSION;
                    settings = stored;
                    settings.algAufPrefs = {};
                    saveSettings();
                    break;
                case 2: // accept version 2
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
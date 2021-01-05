var Settings = (function () {

    const VERSION = 4;

    var settings = { // defaults
        version: VERSION,
        randomAuf: true,
        randomOrder: false,
        simpleDiagram: false,
        llHide: "show_all",
        upColors: { yellow: true, red: true, blue: false },
        algs: ["cmll_s_left_bar"],
        algAufPrefs: {},
        algStats: {},
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
                case 2: // migrate to version 3
                    stored.version = VERSION;
                    settings = stored;
                    settings.algStats = {};
                    break;
                case 3: // accept version 3
                    stored.version = VERSION;
                    settings = stored;
                    settings.llHide = "show_all";
                    break;
                case 4: // accept version 3
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
var Settings = (function () {

    const VERSION = 5;

    var settings = { // defaults
        version: VERSION,
        randomAuf: true,
        randomOrder: "random_off",
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
                case 1: // migrate to version 5
                    stored.version = VERSION;
                    settings = stored;
                    settings.algAufPrefs = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 2: // migrate to version 5
                    stored.version = VERSION;
                    settings = stored;
                    settings.algStats = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 3: // migrate to version 5
                    stored.version = VERSION;
                    settings = stored;
                    settings.llHide = "show_all";
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 4: // migrate to version 5
                    stored.version = VERSION;
                    settings = stored;
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 5: // accept version 5
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
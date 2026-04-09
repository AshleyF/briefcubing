var Settings = (function () {

    const VERSION = 6;

    var settings = { // defaults
        version: VERSION,
        randomAuf: true,
        randomOrder: "random_off",
        simpleDiagram: false,
        llHide: "show_all",
        upColors: { yellow: true, red: true, blue: false },
        algs: ["cmll_s_left_bar"],
        algAufPrefs: {},
        algRatings: {},
        algStats: {},
        timeout: 3,
        lang: "en"
    };
    if (localStorage.settings) {
        var stored = JSON.parse(localStorage.settings);
        if (stored) {
            switch (stored.version) {
                case 1: // migrate to version 6
                    stored.version = VERSION;
                    settings = stored;
                    settings.algAufPrefs = {};
                    settings.algRatings = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 2: // migrate to version 6
                    stored.version = VERSION;
                    settings = stored;
                    settings.algStats = {};
                    settings.algRatings = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 3: // migrate to version 6
                    stored.version = VERSION;
                    settings = stored;
                    settings.llHide = "show_all";
                    settings.algRatings = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 4: // migrate to version 6
                    stored.version = VERSION;
                    settings = stored;
                    settings.algRatings = {};
                    settings.randomOrder = stored.randomOrder ? "random_balanced" : "random_off";
                    saveSettings();
                    break;
                case 5: // migrate to version 6
                    stored.version = VERSION;
                    settings = stored;
                    settings.algRatings = stored.algRatings || {};
                    saveSettings();
                    break;
                case 6: // accept version 6
                    settings = stored;
                    settings.algRatings = stored.algRatings || {};
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
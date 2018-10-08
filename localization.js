var Localization = (function () {
    langs = {
        en: {
            lang_en: "English",
            lang_zh: "Chinese (中文)",
            briefDrills: "Brief Drills",
            giikerConnect: "Connect GiiKER Supercube",
            giikerConnecting: "Connecting...",
            giikerDisconnect: "Disconnect GiiKER Cube",
            giikerBuy: "I don't have one",
            retry: "Retry",
            next: "Next",
            on: "On",
            off: "Off",
            randomAuf: "Random AUF",
            simplifiedDiagram: "Simplified Diagram",
            upColors: "Up Colors",
            feedback: "Send Feedback",
            allCases: "All [ALG] Cases",
            moreInfo: "More info",
            recognitionTime: "Recognition",
            executionTime: "Execution",
            customScheme: "Custom scheme",
            customSchemeReset: "Reset to default colors",
            language: "Language"
        },
        zh: {
            lang_en: "英语 (English)",
            lang_zh: "中文",
            briefDrills: "Brief 演习",
            giikerConnect: "连接GiiKER Supercube",
            giikerConnecting: "连接过程...",
            giikerDisconnect: "断开GiiKER Cube",
            giikerBuy: "我没有",
            retry: "重试",
            next: "下一个",
            on: "开",
            off: "关",
            randomAuf: "随机 AUF",
            simplifiedDiagram: "更简单的图表",
            upColors: "颜色朝上",
            feedback: "发送反馈",
            allCases: "所有[ALG]案件",
            moreInfo: "更多信息",
            recognitionTime: "认可",
            executionTime: "执行",
            customScheme: "自定义配色方案",
            customSchemeReset: "重置为默认颜色",
            language: "语言"
        }
    }

    function getString(id) {
        var lang = Settings.values.lang || "en";
        return langs[lang][id];
    }

    return {
        langs: langs,
        getString: getString
    };
}());
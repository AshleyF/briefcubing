var Localization = (function () {
    langs = {
        en: {
            lang_en: "English",
            lang_zh: "Chinese (中文)",
            lang_es: "Spanish (Español)",
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
            hint: "Hint",
            recognitionTime: "Recognition",
            executionTime: "Execution",
            customScheme: "Custom scheme",
            customSchemeReset: "Reset to default colors",
            btError: "Connection Error",
            btSupport: "The following are supported:",
            btAndroid: "Chrome on Android",
            btIOS: "WebBLE App on iOS",
            btMacOS: "Chrome on MacOS",
            btLinux: "Chrome on Linux",
            btWindows: "Chrome Canary on Windows",
            language: "Language"
        },
        zh: {
            lang_en: "英语 (English)",
            lang_zh: "中文",
            lang_es: "西班牙语 (Español)",
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
            hint: "暗示",
            recognitionTime: "认可",
            executionTime: "执行",
            customScheme: "自定义配色方案",
            customSchemeReset: "重置为默认颜色",
            btError: "连接错误",
            btSupport: "支持以下内容：",
            btAndroid: "Android上的Chrome",
            btIOS: "iOS上的WebBLE应用程序",
            btMacOS: "Chrome上的MacOS",
            btLinux: "Chrome上的Linux",
            btWindows: "Chrome Canary上的Windows",
            language: "语言"
        },
        es: {
            lang_en: "Inglés (English)",
            lang_zh: "Chino (中文)",
            lang_es: "Español",
            briefDrills: "Brief Ejercicios",
            giikerConnect: "Conectar Supercube GiiKER",
            giikerConnecting: "Conectando...",
            giikerDisconnect: "Desconecta el cubo GiiKER",
            giikerBuy: "No tengo uno",
            retry: "Otra vez",
            next: "Siguiente",
            on: "", // doesn't fit
            off: "", // doesn't fit
            randomAuf: "AUF Aleatorio",
            simplifiedDiagram: "Diagrama Simplificado",
            upColors: "Colores hacia arriba",
            feedback: "Enviar comentarios",
            allCases: "Todos los casos [ALG]",
            moreInfo: "Más información",
            hint: "Insinuación",
            recognitionTime: "Reconocimiento",
            executionTime: "Ejecución",
            customScheme: "Esquema personalizado",
            customSchemeReset: "Restablecer los colores predeterminados",
            btError: "Error de conexión",
            btSupport: "Los siguientes son compatibles:",
            btAndroid: "Chrome en Android",
            btIOS: "Aplicación WebBLE en iOS",
            btMacOS: "Chrome en MacOS",
            btLinux: "Chrome en Linux",
            btWindows: "Chrome Canary en Windows",
            language: "Idioma"
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
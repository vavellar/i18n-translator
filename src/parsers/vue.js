import fs from "fs-extra";

/**
 * Extrai strings literais de um arquivo Vue e aplica $t(), preservando indentação.
 * Ignora strings já traduzidas ou expressões JS dinâmicas.
 */
export async function extractVueStringsComplete(filePath, prefix = "", keepAccents = false) {
    let content = await fs.readFile(filePath, "utf-8");
    const translations = {};

    const textProps = ["text", "label", "placeholder", "title"];

    // Verifica se já está traduzido
    const isAlreadyTranslated = (text) => {
        if (!text) return false;
        return text.includes("$t(") || text.includes("v-t");
    };

    // Verifica se é uma expressão JS dinâmica
    const isDynamicJS = (text) => {
        return /[\|\&\.\(\)]/.test(text);
    };

    // 1️⃣ Props literais e ternários simples
    textProps.forEach((prop) => {
        const regex = new RegExp(`(:?${prop})\\s*=\\s*"([^"]+)"`, "g");
        content = content.replace(regex, (match, p, value) => {
            // mantém a prop original se já traduzida ou JS dinâmico
            if (isAlreadyTranslated(value) || isDynamicJS(value)) return match;

            // Detecta se já tinha binding (:prop)
            const hasColon = p.startsWith(":");
            const propName = hasColon ? p.slice(1) : p;

            if (value.includes("?") && value.includes(":")) {
                const newValue = value.replace(/(['"`])(.*?)\1/g, (m, quote, str) => {
                    if (isAlreadyTranslated(str)) return str;
                    const key = buildKey(str, prefix, keepAccents);
                    translations[key] = str;
                    return `$t('${key}')`;
                });
                return `${hasColon ? ":" : ":"}${propName}="${newValue}"`;
            } else {
                const key = buildKey(value, prefix, keepAccents);
                translations[key] = value;
                return `${hasColon ? ":" : ":"}${propName}="$t('${key}')"`;
            }
        });
    });


    // 2️⃣ Literais dentro de {{ ... }} (inclusive ternários)
    const curlyRegex = /{{\s*([^}]+)\s*}}/g;
    content = content.replace(curlyRegex, (_, inner) => {
        const newInner = inner.replace(/(['"`])(.*?)\1/g, (m, quote, str) => {
            if (isAlreadyTranslated(str)) return str;
            const key = buildKey(str, prefix, keepAccents);
            translations[key] = str;
            return `$t('${key}')`;
        });
        return `{{ ${newInner} }}`;
    });

    // 3️⃣ Literais diretos em tags HTML (somente se não tiver bindings ou $t)
    content = content.replace(/>([^<>{}]+)</g, (_, text) => {
        const trimmed = text.trim();
        if (!trimmed || isAlreadyTranslated(trimmed) || isDynamicJS(trimmed)) return `>${text}<`;
        const key = buildKey(trimmed, prefix, keepAccents);
        translations[key] = trimmed;
        return `>{{ $t('${key}') }}<`;
    });

    return { translations, updatedContent: content };
}

/**
 * Cria uma key a partir do texto
 */
function buildKey(text, fileNamePrefix = "", keepAccents = false) {
    let key = text.toLowerCase().replace(/\s+/g, "_");
    if (!keepAccents) key = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    key = key.replace(/[^\w]/g, "");
    return fileNamePrefix ? `${fileNamePrefix.toLowerCase()}.${key}` : key;
}

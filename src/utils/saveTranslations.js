import fs from "fs-extra";
import path from "path";

export async function saveTranslations(translations, outputDir, fileNamePrefix) {
    const structured = {};

    // Separar por prefixo (ex: 'extract.')
    Object.entries(translations).forEach(([fullKey, value]) => {
        const [prefix, ...rest] = fullKey.split(".");
        if (!structured[prefix]) structured[prefix] = {};
        structured[prefix][rest.join(".")] = value;
    });

    const lines = ["export default {"];
    Object.entries(structured).forEach(([prefix, obj]) => {
        lines.push(`  ${prefix}: {`);
        Object.entries(obj).forEach(([key, value]) => {
            lines.push(`    ${key}: "${value}",`);
        });
        lines.push("  },");
    });
    lines.push("};");

    // Salvar em um arquivo .js
    await fs.ensureDir(outputDir);
    const filePath = path.join(outputDir, `${fileNamePrefix.toLowerCase()}.js`);
    await fs.writeFile(filePath, lines.join("\n"), "utf-8");

    console.log(`✅ Traduções salvas em ${filePath}`);
}

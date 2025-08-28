#!/usr/bin/env node
console.log("🚀 i18n-translator iniciado");

import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { program } from "commander";
import {extractVueStringsComplete} from "../src/parsers/vue.js";
import { saveTranslations } from "../src/utils/saveTranslations.js";

function detectFramework(file, fallback) {
    const ext = path.extname(file);
    switch (ext) {
        case ".vue": return "vue";
        case ".jsx":
        case ".tsx": return "react";
        case ".html":
        case ".ts": return "angular";
        default: return fallback || "vue";
    }
}

program
    .command("extract")
    .description("Extrai strings hardcoded e gera arquivos i18n")
    .requiredOption("-s, --src <file>", "Arquivo fonte (.vue, .jsx, .tsx, .ts, .html)")
    .option("-f, --framework <name>", "Força o framework (vue, react, angular)")
    .option("-o, --output <path>", "Diretório de saída", "./src/locales")
    .action(async (options) => {
        const framework = options.framework || detectFramework(options.src);
        console.log(chalk.cyan(`🔍 Extraindo traduções de ${options.src} (${framework})...`));
        const filePath = options.src
        const fileNamePrefix = path.basename(filePath, path.extname(filePath));

        if (framework === "vue") {
            const { translations, updatedContent } = await extractVueStringsComplete(
                filePath,
                fileNamePrefix
            );

            await saveTranslations(translations, options.output, fileNamePrefix);

            if (updatedContent) {
                await fs.writeFile(options.src, updatedContent, "utf-8");
                console.log(chalk.yellow(`✍️  Arquivo atualizado: ${options.src}`));
            }

            console.log(chalk.green("✅ Traduções extraídas e salvas com sucesso!"));
        } else {
            console.log(chalk.red(`❌ Framework "${framework}" ainda não suportado.`));
        }
    });

program.parse(process.argv);

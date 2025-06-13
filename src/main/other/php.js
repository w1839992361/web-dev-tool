const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
import { ipcMain } from 'electron';


/**
 * 获取 PHP 信息
 * @param {string} phpPath - php 可执行文件路径（如 XX/php74/php.exe）
 * @returns {Object} 包含模式和扩展列表
 */
function getPhpInfo(phpPath) {
    try {
        // 获取 Server API
        const infoOutput = execSync(`"${phpPath}/php.exe" -i`).toString();
        const modeMatch = infoOutput.match(/Server API => (.+)/);
        const mode = modeMatch ? modeMatch[1].trim() : 'Unknown';

        // 获取已启用扩展（php -m）
        const modulesOutput = execSync(`"${phpPath}/php.exe" -m`).toString();
        const enableExtList = modulesOutput
            .split(/\r?\n/)
            .map(line => line.trim().toLowerCase())
            .filter(line => line && !line.startsWith('['));

        // 获取 ext 目录的扩展列表（去除 php_ 前缀）
        const availableExtFiles = fs.readdirSync(`${phpPath}/ext`);
        const availableExtList = availableExtFiles
            .filter(file => file.endsWith('.dll') || file.endsWith('.so'))
            .map(file => path.basename(file, path.extname(file)).toLowerCase().replace(/^php_/, ''));

        // 合并去重
        const allExtSet = new Set([...enableExtList, ...availableExtList]);

        const extensions = Array.from(allExtSet).map(name => ({
            name,
            isEnable: enableExtList.includes(name)
        }));

        return {
            mode,
            extensions
        };
    } catch (err) {
        return {
            mode: 'Error',
            extensions: [],
            error: err.message
        };
    }
}
/**
 * 切换 PHP 扩展开关（通过操作 php.ini）
 * @param {string} iniPath - php.ini 文件路径
 * @param {string} extName - 扩展名（如 curl、gd）
 * @param {boolean} enable - 是否启用
 */
function togglePhpExtension(iniPath, extName, enable) {
    let iniContent = fs.readFileSync(iniPath, 'utf-8');
    const regex = new RegExp(`^\\s*;?\\s*extension\\s*=\\s*${extName}\\s*$`, 'im');

    if (regex.test(iniContent)) {
        // 替换已有
        iniContent = iniContent.replace(regex, enable ? `extension=${extName}` : `;extension=${extName}`);
    } else {
        // 追加新行
        iniContent += `\n${enable ? '' : ';'}extension=${extName}`;
    }

    fs.writeFileSync(iniPath, iniContent);
}

ipcMain.handle('getPhpInfo', async (_event, phpPath) => {
    return getPhpInfo(phpPath);
});

ipcMain.handle('togglePhpExtension', async (_event, iniPath, extName, enable) => {
    togglePhpExtension(iniPath, extName, enable);
});


import fs from 'fs';
import path from 'path';
import { ipcMain } from 'electron';

ipcMain.handle('list-subfolders', async (_event, dirPath) => {
    try {
        const subfolders = fs.readdirSync(dirPath).filter(name => {
            const fullPath = path.join(dirPath, name);
            return fs.statSync(fullPath).isDirectory();
        });
        console.log(subfolders)
        return subfolders.map(item => {
            return {
                fullPath: path.join(dirPath, item),
                folderName: item
            }
        });
    } catch (err) {
        return [];
    }
});

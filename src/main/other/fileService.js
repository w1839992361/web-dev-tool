import fs from 'fs/promises'; // 使用Promise-based API
import path from 'path';
import { ipcMain, app } from 'electron';

ipcMain.handle('list-subfolders', async (_event, relativePath) => {
  try {
    // 获取正确的基准路径
    const basePath = process.env.NODE_ENV === 'development'
      ? path.join(app.getAppPath(), relativePath)
      : path.join(process.resourcesPath, relativePath);


    const items = await fs.readdir(basePath, { withFileTypes: true });
    
    const subfolders = items
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        fullPath: path.join(basePath, dirent.name),
        folderName: dirent.name
      }));

    console.log('Found subfolders:', subfolders);
    return subfolders;
    
  } catch (err) {
    console.error('Error listing subfolders:', err);
    
    // 返回更详细的错误信息
    return {
      error: true,
      message: err.message,
      code: err.code
    };
  }
});
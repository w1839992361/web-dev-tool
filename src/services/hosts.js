const fs = require('fs');
const os = require('os');
const hostsPath = os.platform() === 'win32'
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
    : '/etc/hosts';

export function addHost(domain) {
    const line = `127.0.0.1 ${domain}\n`;
    //   fs.appendFileSync(hostsPath, line);
    return 'hosts 已更新', hostsPath;
}

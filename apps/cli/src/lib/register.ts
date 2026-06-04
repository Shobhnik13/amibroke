import { join } from 'path';
import { mkdir } from 'node:fs/promises';

// Writes the OS service files and registers the daemon.
// Called once from init.ts after auth is complete.

export async function registerDaemon(bunPath: string, daemonScriptPath: string): Promise<void> {
  if (process.platform === 'darwin') {
    await registerLaunchd(bunPath, daemonScriptPath);
  } else if (process.platform === 'linux') {
    await registerSystemd(bunPath, daemonScriptPath);
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export async function unregisterDaemon(): Promise<void> {
  if (process.platform === 'darwin') {
    await Bun.$`launchctl unload ~/Library/LaunchAgents/dev.amibroke.daemon.plist`.quiet();
  } else if (process.platform === 'linux') {
    await Bun.$`systemctl --user disable --now amibroke.timer`.quiet();
  }
}

async function registerLaunchd(bunPath: string, daemonScriptPath: string): Promise<void> {
  const logPath = join(process.env.HOME!, '.config', 'amibroke', 'daemon.log');
  const plistPath = join(process.env.HOME!, 'Library', 'LaunchAgents', 'dev.amibroke.daemon.plist');

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.amibroke.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>${bunPath}</string>
    <string>run</string>
    <string>${daemonScriptPath}</string>
  </array>
  <key>StartInterval</key>
  <integer>10800</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
</dict>
</plist>`;

  await Bun.write(plistPath, plist);
  await Bun.$`launchctl load ${plistPath}`.quiet();
}

async function registerSystemd(bunPath: string, daemonScriptPath: string): Promise<void> {
  const unitDir = join(process.env.HOME!, '.config', 'systemd', 'user');
  await mkdir(unitDir, { recursive: true });

  await Bun.write(
    join(unitDir, 'amibroke.service'),
    `[Unit]
Description=amibroke sync daemon

[Service]
Type=oneshot
ExecStart=${bunPath} run ${daemonScriptPath}
`,
  );

  await Bun.write(
    join(unitDir, 'amibroke.timer'),
    `[Unit]
Description=amibroke sync timer

[Timer]
OnBootSec=2min
OnUnitActiveSec=3h

[Install]
WantedBy=timers.target
`,
  );

  await Bun.$`systemctl --user enable --now amibroke.timer`.quiet();
}

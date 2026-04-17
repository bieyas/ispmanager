const path = require("node:path");

const rootDir = __dirname;

module.exports = {
  apps: [
    {
      name: "ispmanager-api",
      cwd: path.join(rootDir, "apps/api"),
      script: "./dist/server.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3000,
      },
    },
    {
      name: "ispmanager-admin-web",
      cwd: path.join(rootDir, "apps/admin-web"),
      script: "./server.mjs",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3001,
      },
    },
  ],
};

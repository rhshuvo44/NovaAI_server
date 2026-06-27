module.exports = {
  apps: [
    {
      name: 'ai-workspace-api',
      script: 'dist/server.js',
      node_args: '-r tsconfig-paths/register',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 16000, // slightly above the app's own 15s graceful shutdown timeout
      wait_ready: false,
      listen_timeout: 10000,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

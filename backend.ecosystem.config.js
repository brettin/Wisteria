module.exports = {
  apps: [
    {
      name: "Wisteria-API",
      cwd: "/home/ac.cucinell/WisteriaUI/Wisteria",
      script: "./start_backend.sh",          // relative to cwd
      interpreter: "/bin/bash",              // ensures it's run as a shell script
      exec_mode: "fork",                     // fork mode for shell scripts
      instances: 1,                          // start with 1 instance
      cron_restart: "30 4 * * *",
      error_file: "./pm2_output/wisteria-api.error.log",
      out_file: "./pm2_output/wisteria-api.out.log",
      pid_file: "./pm2_output/wisteria-api.pid"
    }
  ]
}

module.exports = {
  apps: [
    {
      name: "Wisteria-web",
      cwd: "/home/ac.cucinell/WisteriaUI/Wisteria",
      script: "./start_frontend.sh",
      interpreter: "/bin/bash",
      exec_mode: "fork",          // change to fork for shell scripts
      instances: 1,               // start with 1 instance
      cron_restart: "30 4 * * *",
      error_file: "./pm2_output/wisteria-web.error.log",
      out_file: "./pm2_output/wisteria-web.out.log",
      pid_file: "./pm2_output/wisteria-web.pid"
    }
  ]
}


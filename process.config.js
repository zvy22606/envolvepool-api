module.exports = {
  apps: [
    {
      name: 'launch-pool',              // 应用名称
      script: './dist/index.js',        // 启动脚本
      instances: 1,                // 实例数，设置为 "max" 将使用机器的CPU核心数
      // exec_mode: 'cluster',        // 使用集群模式
      env: {
        NODE_ENV: 'development',   // 开发环境
        PORT: 3000                 // 端口设置为 80
      },
      env_production: {
        NODE_ENV: 'production',    // 生产环境
        PORT: 80                   // 生产环境端口设置为 80
      }
    }
  ]
};

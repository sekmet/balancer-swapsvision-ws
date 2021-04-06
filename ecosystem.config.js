module.exports = {
    apps : [  {
      name: 'balancer-ws.swaps',
      script: 'dist/src/index.js',
      watch: ["."],
      // Delay between restart
      watch_delay: 1000,
      ignore_watch : [".git", "dist", "node_modules", "logs", "ws.tar.gz"],
    }]
  };
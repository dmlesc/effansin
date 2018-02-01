'use strict';

var port = 12345;
var ip = '0.0.0.0';
const http = require('http');
var register = {};

var metrics = () => {  
  var start_cpu_usage = process.cpuUsage();
  var cpu_usage_user = 0;
  var cpu_usage_system = 0;
  
  const server = http.createServer((req, res) => {
    //console.log(new Date().toJSON() + ' - ' + req.url);
    var code = 200;
    var data = '';
  
    if (req.url == '/metrics') {
      const uptime = process.uptime();
      const mem = process.memoryUsage();
      const cpu = process.cpuUsage(start_cpu_usage);
      start_cpu_usage = process.cpuUsage();
      cpu_usage_user += cpu.user;
      cpu_usage_system += cpu.system;
  
      data += 'nodejs_process_uptime ' + uptime + '\n'; 
      data += 'nodejs_process_memory{type="rss"} ' + mem.rss + '\n'; 
      data += 'nodejs_process_memory{type="heapUsed"} ' + mem.heapUsed + '\n'; 
      data += 'nodejs_process_memory{type="heapTotal"} ' + mem.heapTotal + '\n'; 
      data += 'nodejs_process_cpu{type="user"} ' + cpu.user + '\n'; 
      data += 'nodejs_process_cpu{type="system"} ' + cpu.system + '\n'; 
      data += 'nodejs_process_cpu_total{type="user"} ' + cpu_usage_user + '\n'; 
      data += 'nodejs_process_cpu_total{type="system"} ' + cpu_usage_system + '\n'; 

      Object.keys(register).forEach( (metric) => {
        //console.log(metric);
        data += 'nodejs_' + metric + ' ' + register[metric]['value'] + '\n';
      });
      


    }
    else {
      code = 404;
      data = 'not found';
    }

    res.writeHead(code, { 'Content-Type': 'text/plain' });
    res.end(data);
  });
  
  server.listen(port, ip);
  console.log('ready to serve metrics');
}

metrics.log = () => {
  console.log('hello');
}

metrics.register = (name) => {
  //console.log('name:', name);
  register[name] = {start:0, value:0};
}

metrics.startTime = (name) => {
  register[name]['start'] = process.hrtime();
}

metrics.endTime = (name) => {
  var diff = process.hrtime(register[name]['start']);
  var ms = Math.round(diff[0] * 1000 + diff[1] / 1000000);
  register[name]['value'] += ms;
  //console.log(ms, register[name]['value']);
}

metrics.set = (name, value) => {
  register[name]['value'] = value;
}

module.exports = metrics;
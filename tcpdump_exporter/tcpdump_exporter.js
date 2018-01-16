'use strict';

var metrics = require('./metrics');
metrics();
//metrics.log();
//setTimeout(metrics.log, 5000);

const nic = 'ens3';

const { spawn } = require('child_process');
const tcpdump = spawn('tcpdump', ['-i', nic, '-nl']);

tcpdump.stdout.on('data', (data) => {
  //console.log(`\n**************\nstdout:\n\n${data}\n**************\n`);
  var d = new Date();
  var year = d.getUTCFullYear();
  var month = d.getUTCMonth();
  var day = d.getUTCDate();

  var packets = data.toString().split('\n');

  for (var i=0; i<packets.length; i++) {
    //console.log(packets[i]);
    var packet = packets[i];

    if (packet != '') {
      var packet_split = packet.split(' ');
      var ts = packet_split[0].split(':');
      var sec = ts[2].split('.');
      var timestamp = new Date(year, month, day, ts[0], ts[1], sec[0], sec[1] / 1000).toJSON();
      //console.log(ts, timestamp)

      if (packet_split[1] == 'IP') {
        //console.log(packet);
        var protocol = 'IP';

        var src = parseIPPort(packet_split[2]);
        var dst = parseIPPort(packet_split[4]);
        //console.log(src, dst);

        var flags = packet_split[6].slice(1, -2);
        //console.log(flags, packet_split[6]);

        var length = packet_split[packet_split.indexOf('length') + 1];
        //console.log(length);


      }
      else if (packet_split[1] == 'ARP,') {
        //console.log(packet);
      }
      else {
        //console.log(packet);
      }
    }
    
    

  }
});


function parseIPPort(str) {
  var obj = {};
  var str_split = str.split('.');
  obj.ip = str_split.slice(0,4).join('.');
  obj.port = str_split[4].replace(':', '');
  return obj;
}

tcpdump.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

tcpdump.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
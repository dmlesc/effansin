'use strict';

var metrics = require('./metrics');
metrics();
//metrics.log();
//setTimeout(metrics.log, 5000);

const nic = 'ens3';

const { spawn } = require('child_process');
const pcap = spawn('tcpdump', ['-i', nic, '-nl']);

pcap.stdout.on('data', (data) => {
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
      var timestamp = new Date(year, month, day, ts[0], ts[1], sec[0], sec[1] / 1000);
      //console.log(ts, timestamp.toJSON())

      if (packet_split[1] == 'IP') {

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

pcap.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

pcap.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
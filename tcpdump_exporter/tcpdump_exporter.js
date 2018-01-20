'use strict';
process.on('uncaughtException', (err) => { console.log(err); });

const conf = require('./conf/' + process.argv[2]);
const elasticsearch = require('elasticsearch');
const elastic = new elasticsearch.Client({
  host: conf.elasticHost
  //, log: 'trace'
});
var metrics = require('./metrics');
metrics();
//metrics.log();
//setTimeout(metrics.log, 5000);

const nic = 'ens3';
var packetsQueue = [ [], [] ];

const { spawn } = require('child_process');
const tcpdump = spawn('tcpdump', ['-i', nic, '-nl']);

tcpdump.stderr.on('data', (data) => { console.log(`stderr: ${data}`); });
tcpdump.on('close', (code) => { console.log(`exit: ${code}`); });

tcpdump.stdout.on('data', (data) => {
  var timestamp = new Date().toJSON();
  var packets = data.toString().split('\n');

  for (var i=0; i<packets.length; i++) {
    //console.log(packets[i]);
    var packet = packets[i].split(' ');

    if (packet.length > 1) {
      if (packet[1] == 'IP') {
        var protocol = 'IP';
        var src = parseIPPort(packet[2]);
        var dst = parseIPPort(packet[4]);
        var flags = packet[6].slice(1, -2);
        var length = packet[packet.indexOf('length') + 1];

        var doc = {};
        doc.timestamp = timestamp;
        doc.protocol = protocol;
        doc.src_ip = src.ip;
        doc.src_port = src.port;
        doc.dst_ip = dst.ip;
        doc.dst_port = dst.port;
        doc.flags = flags;
        doc.length = length;

        packetsQueue[0].push(doc);
      }
      else if (packet[1] == 'ARP,') {
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

  if (str_split[4] != undefined) {
    obj.port = str_split[4].replace(':', '');
  }
  
  return obj;
}


function flushPackets() {
  if (packetsQueue[0].length) {
    var packets = packetsQueue.shift();
    packetsQueue.push([]);

    var bulk = [];

    for (var i=0; i<packets.length; i++) {
      var packet = packets[i];
      var date = packet.timestamp.split('T')[0];
      var index = {};
      index._index = 'tcpdump-' + date;
      index._type = 'doc';

      var action = {};
      action.index = index;
      bulk.push(action);
      bulk.push(packet);
    }
    //console.log('bulk ready');
    elasticBulk(bulk);
  }
}

function elasticBulk(bulk) {
  elastic.bulk({ body: bulk }, (err, res) => {
    if (err) { console.log(err); }
    else {
      //console.log(res);
      console.log('bulk inserted:', bulk.length / 2);
    }
  });
}

var flushInterval = setInterval(flushPackets, conf.flushFreq);
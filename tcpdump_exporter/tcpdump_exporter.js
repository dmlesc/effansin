'use strict';
process.on('uncaughtException', (err) => { console.log(err); });

const elasticsearch = require('elasticsearch');
const elastic = new elasticsearch.Client({
  host: 'http://fnsn0:9200'
  //, log: 'trace'
});
var metrics = require('./metrics');
metrics();
//metrics.log();
//setTimeout(metrics.log, 5000);

const NICs = ['ens32','ens33','ens34','ens35'];
var packetsQueue = [ [], [] ];
const interval = 5000;
const packetsLimit = 5000;
var bulkQueue = [];
var processing = false;

const { spawn } = require('child_process');


function spawns(nic) {
  const tcpdump = spawn('tcpdump', ['-i', nic, '-l', '-s', '75']);

  tcpdump.stderr.on('data', (data) => { console.log(`stderr: ${data}`); });
  tcpdump.on('close', (code) => { console.log('close:', code); });
  
  tcpdump.stdout.on('data', (data) => {
    var timestamp = new Date().toJSON();
    var packets = data.toString().split('\n');
  
    for (var i=0; i<packets.length; i++) {
      //console.log(packets[i]);
      var packet = packets[i].split(' ');
  
      if (packet.length > 1) {
        if (packet[1] == 'IP') {
          var src = parseHostPort(packet[2]);
          var dst = parseHostPort(packet[4]);
  
          var flags;
          if (packet[6] == undefined) { flags = packet[5]; }
          else { flags = packet[6].slice(1, -2); }
  
          var doc = {};
          doc.timestamp = timestamp;
          doc.protocol = 'IP';
          doc.src_host = src.host;
          doc.src_port = src.port;
          doc.dst_host = dst.host;
          doc.dst_port = dst.port;
          doc.flags = flags;
          doc.length = packet[packet.indexOf('length') + 1];
          doc.nic = nic;
  
          packetsQueue[0].push(doc);
        }
        else if (packet[1] == 'ARP,') { /*console.log(packet);*/ }
        else { /*console.log(packet);*/ }
  
        if (packetsQueue[0].length >= packetsLimit) {
          flushPackets();
        }
      }
    }
  });
}

function parseHostPort(str) {
  var str = str.split('.');
  var obj = {};
  obj.host = str.slice(0,-1).join('.');;
  obj.port = str[str.length - 1].replace(':', '');;
  
  return obj;
}

function flushPackets() {
  if (packetsQueue[0].length) {
    var packets = packetsQueue.shift();
    packetsQueue.push([]);

    var bulk = [];
    var date = packets[0].timestamp.split('T')[0].slice(0,7).replace('-', '.');
    var index = { _index: 'tcpdump-' + date, _type: 'doc' };
    var action = { index: index };

    for (var i=0; i<packets.length; i++) {
      bulk.push(action);
      bulk.push(packets[i]);
    }

    bulkQueue.push(bulk);
  }
}

function flushBulk() {
  if (!processing && bulkQueue.length) {
    processing = true;
    elasticBulk(bulkQueue.shift());
  }
}

function elasticBulk(bulk) {
  elastic.bulk({ body: bulk }, (err, res) => {
    if (err) { console.log(err); bulkQueue.push(bulk); }
    else {
      //console.log(res);

      if (bulkQueue.length) {
        //console.log('bulkQueue.length:', bulkQueue.length);
        elasticBulk(bulkQueue.shift());
      }
      else {
        processing = false;
      }
    }
  });
}

var flushP = setInterval(flushPackets, interval);
var flushB = setInterval(flushBulk, interval);

for (var i=0; i<NICs.length; i++) {
  spawns(NICs[i]);
}
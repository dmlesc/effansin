# effansin

## background

This project had its inception when I came across some unused hardware in a closet. It was a network analytics appliance produced by a company from the down under that required a license to be useful. I almost threw it in the garbage, but because of my natural curiosity I decided to open it up and see what's inside.

I discovered that it was a standard x86 computer based on the Lanner FW-7540 and rebranded. It's also similar to some of the ready-made pfSense appliances marketed (albeit older hardware). So, for fun I installed pfSense to see if it would work and it did. Also, I was able to install Ubuntu Server 16.04 LTS and all the hardware was recognized perfectly.

I did some research and decided to use this box to create a free packet analysis box. At the time I thought that Elastic Stack's Packetbeat was only included in a paid X-Pack license. But, now (6 months later) it looks like Packetbeat is free to use - maybe that changed with the 6.X release. Anyways, I'm proud of what I created here and Packetbeat will be a path I'll have to explore later.

I flipped the name of the original appliance and created this repo.

## how it works

I made a Node.js app to wrap and parse the output of the well-known command-line packet capture tool `tcpdump` and insert it into `Elasticsearch` for analytics. I use Prometheus to monitor OS level metrics and the app itself and `Kibana` and `Grafana` to visualize the data. I use `Ansible` to automate a lot of the installation, but there are some manual tasks as well - all of which is documented in `setup.txt`.

These are the fields captured and available for analysis:
* `timestamp`
* `protocol` - IP (more protocols could be added later)
* `src_host`
* `src_port`
* `dst_host`
* `dst_port`
* `flags` 
* `length` - size in `bytes` of packet payload (not including overhead)
* `nic` - name of network interface the packet was captured on

I use the least verbose output `tcpdump` is capable to keep it simple and minimize resources and time to parse the output. Keep in mind that the app does a very good job answering the questions:
- `Where is traffic going on the network?`
- `How much traffic?`

I think that beyond this level of analysis, a better tool to use would be the command-line version of `wireshark`. It has better built-in analysis options and can output in JSON which will dramatically decrease the complexity when inserting data into elasticsearch.

The box is setup as a network bridge/switch which means that you can connect any device to an empty network port and it will automatically start capturing traffic from and to that device.

## about setup

The setup instructions should be modified and adapted to work on any Unix-like OS that can run `tcpdump`, `Node.js`, `Prometheus`, `Elastic Stack`, and `Grafana`. Nothing is set in stone and much can be changed to whatever floats your boat.

`setup.txt` assumes the user has knowledge of Ansible. It lists steps to be performed on the packet capture box under the heading `fnsn0` and steps to be performed on the Ansible control box as `ctrl0`. As such, you'll have to modify the commands and enviroment `hosts` file with the correct host name. Also, you'll have to changed the `nics` in `tcpdump_exporter.js` to the interface names on your hardware.

## screenshots
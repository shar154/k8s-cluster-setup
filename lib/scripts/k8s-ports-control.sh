#!/bin/bash

# Ensure the script is run as root
if [[ "${EUID}" -ne 0 ]]; then
    echo "This script must be run as root" 
    exit 1
fi

# Set up iptables for Kubernetes control plane

# Master node ports
# Allow traffic for API Server
iptables -A INPUT -p tcp --dport 6443 -j ACCEPT

# Allow traffic for etcd server client API
iptables -A INPUT -p tcp --dport 2379:2380 -j ACCEPT

# Allow traffic for Kubelet API
iptables -A INPUT -p tcp --dport 10250 -j ACCEPT

# Allow traffic for kube-scheduler
iptables -A INPUT -p tcp --dport 10259 -j ACCEPT

# Allow traffic for kube-controller-manager
iptables -A INPUT -p tcp --dport 10257 -j ACCEPT

# General network rules
# Allow ICMP (ping)
iptables -A INPUT -p icmp -j ACCEPT

# Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT

# Allow established and related incoming connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow all outgoing traffic on HTTPS port
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Allow all other outgoing traffic
iptables -A OUTPUT -j ACCEPT

# Drop all other inbound traffic
iptables -A INPUT -j DROP

# Save the iptables rules
iptables-save > /etc/sysconfig/iptables

echo "Firewall rules set: control plane ports are now open, including HTTPS access."


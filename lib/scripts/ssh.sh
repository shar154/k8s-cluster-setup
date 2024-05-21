#!/bin/bash

# This script configures SSH and iptables to use a specified SSH port.

# Accept the SSH port as a parameter
SSH_PORT="$1"

# Check if the SSH port parameter is provided
if [[ -z "$SSH_PORT" ]]; then
    echo "Usage: $0 <ssh_port>"
    exit 1
fi

# Update sshd_config to set the new SSH port
sed -i "s/^#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config

# Restart the SSH service
service sshd restart

# Install iptables
sudo yum install iptables-services -y

# Update iptables to accept connections on the new SSH port
sudo iptables -A INPUT -p tcp --dport $SSH_PORT -j ACCEPT

# Save the iptables rules
sudo service iptables save

# Restart the iptables service
sudo service iptables restart

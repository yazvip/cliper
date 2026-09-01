#!/bin/bash
if [[ $(grep MemTotal /proc/meminfo | awk '{print $2}') -lt 2097152 ]]; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap 2GB created"
  fi
fi

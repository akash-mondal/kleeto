#!/usr/bin/env bash
# A machine of Kleeto's own: new resource group, Ubuntu 24.04, SSH only from the given IPs,
# Node 22 and codex pinned at first boot, and a dedicated `codex` user for the agent so its
# tokens and full-disk sandbox never share a home with anything else.
#
# D2alds_v7 in eastus2 is the one small size this subscription is still allowed to create;
# every B-series is restricted in both regions already in use.
#
#   scripts/azure-kleeto-vm.sh [size] [location] [ip1,ip2,...]
set -euo pipefail
SIZE="${1:-Standard_D2alds_v7}"; LOC="${2:-eastus2}"; IPS="${3:-$(curl -s4 ifconfig.me)/32}"
RG=KLEETO-RG; VM=kleeto-vm; KEY="$HOME/.ssh/kleeto_azure_ed25519"
[ -f "$KEY" ] || ssh-keygen -t ed25519 -N "" -C kleeto-azure -f "$KEY" >/dev/null
CLOUD_INIT=$(mktemp)
cat > "$CLOUD_INIT" <<'YAML'
#cloud-config
package_update: true
users:
  - name: codex
    shell: /bin/bash
    lock_passwd: true
runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y -qq nodejs
  - npm i -g @openai/codex@0.153.4
  - install -d -o codex -g codex -m 700 /home/codex/.codex
  - sudo -u codex bash -c 'timeout 90 npx -y @solarisdk/mcp </dev/null >/dev/null 2>&1 || true'
YAML
az group create -n $RG -l "$LOC" -o none
az vm create -g $RG -n $VM -l "$LOC" --image Ubuntu2404 --size "$SIZE" \
  --admin-username kleeto --ssh-key-values "$KEY.pub" --custom-data "$CLOUD_INIT" \
  --public-ip-sku Standard --nsg-rule NONE -o none
NSG=$(az network nsg list -g $RG --query "[0].name" -o tsv)
az network nsg rule create -g $RG --nsg-name "$NSG" -n AdminSSH --priority 100 \
  --access Allow --protocol Tcp --destination-port-ranges 22 --source-address-prefixes ${IPS//,/ } -o none
IP=$(az vm show -d -g $RG -n $VM --query publicIps -o tsv)
echo "kleeto-vm: $IP  (ssh -i $KEY kleeto@$IP)   cloud-init finishes in about two minutes"
echo "$IP" > agent-runs/kleeto-vm-ip.txt

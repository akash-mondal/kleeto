# The Kleeto VM

Kleeto's own machine, in its own resource group, created 2026-09-10. Nothing of Kleeto's runs
on any other VM on the subscription; the wikshi and pinout machines are other products and are
not to be touched for this project.

| | |
|---|---|
| Resource group | `KLEETO-RG` |
| VM | `kleeto-vm`, Ubuntu 24.04, `Standard_D2alds_v7` (2 vCPU, 4 GB), eastus2 |
| Why that size | the one small size this subscription is still allowed to create; every B-series is restricted in both regions in use |
| Price | $0.0952/hr, about $69/month running; a few dollars for disk if deallocated between uses |
| Public IP | in `agent-runs/kleeto-vm-ip.txt` (not committed); `az vm show -d -g KLEETO-RG -n kleeto-vm --query publicIps` |
| SSH | `ssh -i ~/.ssh/kleeto_azure_ed25519 kleeto@<ip>`, port 22 open only to the IP that ran the script (`AdminSSH` rule on `kleeto-vmNSG`) |
| Agent user | `codex`, no sudo, owns `/home/codex/.codex` (mode 700) with `auth.json` and `config.toml` (mode 600) |
| Codex | 0.153.4 pinned, Node 22, model `gpt-6-astra`, approval never, full-disk sandbox scoped to the `codex` user |
| MCP | Solari, key written into the config on the box at install time |
| Verified | `codex login status` reports the ChatGPT login; a `codex exec` from the box called `solari_list` through the MCP and returned the right count |

## Operating it

- Refresh the login (tokens rotated, or a new laptop): `SOLARI_API_KEY=... scripts/codex-host-install.sh <ip>`.
- Your IP changed and SSH times out: `az network nsg rule update -g KLEETO-RG --nsg-name kleeto-vmNSG -n AdminSSH --source-address-prefixes <new-ip>/32`.
- Stop paying when idle: `az vm deallocate -g KLEETO-RG -n kleeto-vm`; back with `az vm start`. The public IP is Standard SKU and survives deallocation.
- Run the agent: `sudo -iu codex codex exec "..."` on the box; the Solari tools are already wired.
- Rebuild from nothing: `scripts/azure-kleeto-vm.sh` then the install script. The cloud-init keeps
  Azure's admin user explicitly (`- default`); without that line the first attempt produced a
  machine nobody could log into.

## What was touched elsewhere and put back

Before this VM existed, Codex was briefly installed on the wikshi backend under a `kleeto`
user, on the assumption that "the backend VM" meant the one running machine. That was wrong.
The user, its home, the tokens and the Codex install were removed the same hour, and the
wikshi firewall rule was restored to its original single IP. Node 22 remains there.

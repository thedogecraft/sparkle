---
title: "DNS Manager"
hide:
  - navigation
---

# DNS Page Features

## DNS Providers

The app allows users to select and apply various DNS providers:

| Provider Name        | Primary DNS    | Secondary DNS   | Description                               | Features                                |
| -------------------- | -------------- | --------------- | ----------------------------------------- | --------------------------------------- |
| **Cloudflare**       | 1.1.1.1        | 1.0.0.1         | Fast, secure, and privacy-focused DNS     | Fast, Privacy-focused, Security         |
| **Google**           | 8.8.8.8        | 8.8.4.4         | Reliable and widely used DNS service      | Reliable, Fast, Widely supported        |
| **OpenDNS**          | 208.67.222.222 | 208.67.220.220  | Cisco-owned DNS with content filtering    | Content filtering, Reliable, Security   |
| **Quad9**            | 9.9.9.9        | 149.112.112.112 | Security-focused DNS with threat blocking | Security, Threat blocking, Privacy      |
| **AdGuard DNS**      | 94.140.14.14   | 94.140.15.15    | Blocks ads, trackers, malware             | Security, Threat blocking, Privacy      |
| **Automatic (DHCP)** | Auto           | Auto            | Use your ISP's default DNS servers        | Default, ISP provided, No configuration |

::: info

  Users can select a provider to apply DNS changes the active Wifi And Ethernet adapters.
::: 
---

## Current DNS Settings

- Displays the current DNS servers for all active network adapters.
- Refresh button to re-fetch DNS info.
- Loading indicator while fetching network info.

---

## Custom DNS

Users can optionally configure custom DNS servers:

- **Primary DNS** (required)
- **Secondary DNS** (optional)
- Validation ensures correct IPv4 format.
- Apply button enabled only when input is valid.
- Info message explains correct input requirements.

::: info

  Custom DNS changes are applied to The active Wifi And Ethernet adapters and flush the DNS cache.
:::
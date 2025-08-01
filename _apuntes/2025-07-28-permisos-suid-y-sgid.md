---
title: Permisos SUID y SGID
modulo: M5 - Elevación de privilegios
fecha: 2025-07-28
layout: apunte
slug: 2025-07-28-permisos-suid-y-sgid
---
# Permisos SUID y SGUID
>[!abstract] Definición:
>Son **permisos especiales** que puedes aplicar a archivos ejecutables y directorios, y que modifican el comportamiento estándar de ejecución o acceso.

## SUID (Set User ID)
🔹 **¿Qué hace?**: Cuando un archivo ejecutable tiene el permiso **SUID**, este se ejecuta con los **permisos del propietario del archivo**, no de quien lo ejecuta.

🔹 **¿Cuándo se usa?**: Por ejemplo, el comando `passwd` tiene SUID porque necesita escribir en `/etc/shadow`, que normalmente solo puede modificar `root`

🔹 **¿Puedo asignar ese permiso?**: Sí, con el comando `chmod u+s <archivo>`.

>[!bug] ¿Por qué nos interesa?:
>Si un ejecutable con SUID tiene vulnerabilidades, puede permitir una **escalada de privilegios**.

## SGID (Set Group ID)
🔸 **¿Qué hace?**: Tiene dos usos distintos:
	1. **En ejecutables**: se ejecutan con los privilegios del **grupo propietario** del archivo.    
	2. **En directorios**: **los archivos creados dentro** heredan el **grupo del directorio**, en lugar del grupo primario del usuario.

🔸 **¿Cómo se asigna?**: Con el comando `chmod g+s archivo_o_directorio`

♦️ **¿Cómo saber si un archivo o directorio tiene activado alguno de estos permisos?**

| Permiso      | Significado                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `-rwsr-xr-x` | SUID activo                                                                      |
| `-rwxr-sr-x` | SGID activo                                                                      |
| `-rwx--S--x` | SUID/SGID activo pero sin permiso de ejecución (`S` mayúscula = mal configurado) |
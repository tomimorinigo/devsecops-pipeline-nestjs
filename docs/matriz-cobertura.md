# Matriz de cobertura

Qué herramienta del pipeline detectó cada vulnerabilidad, medido sobre el pipeline real y no estimado.

## Cómo se midió

- La rama `vulnerable` nace de `fixed` y suma **un commit por vulnerabilidad** (`vuln: VULN-XX ...`).
- Cada commit se pusheó por separado y se esperó a que terminara su corrida. Así se ve qué job se pone en rojo **por cada vulnerabilidad**, y no solo el resultado final.
- Los hallazgos se tomaron de los reportes que cada job publica como artifact (SARIF de Semgrep, JSON de gitleaks, npm audit, Trivy y ZAP, JUnit de los tests y log de sqlmap).
- Las mismas herramientas, con los mismos umbrales, corren sobre `fixed` para medir falsos positivos.

Leyenda: ✅ detectó · ❌ no detectó · — no aplica (la herramienta no está pensada para ese tipo de falla)

## Matriz

| ID | Vulnerabilidad | gitleaks | Semgrep público | Semgrep propias | npm audit | Trivy | Tests | ZAP | sqlmap |
|---|---|---|---|---|---|---|---|---|---|
| VULN-01 | SQL injection en el buscador | — | ❌ | ✅ | — | — | ✅ | ✅ | ✅ |
| VULN-02 | IDOR en notas privadas | — | ❌ | ❌ | — | — | ✅ | ❌ | — |
| VULN-03 | XSS reflejado | — | ❌ | ✅ | — | — | ✅ | ✅ | — |
| VULN-04 | XSS almacenado | — | ❌ | ✅ | — | — | ✅ | ❌ | — |
| VULN-05 | CSP desactivada | — | ❌ | ✅ | — | — | ✅ | ✅ | — |
| VULN-06 | CORS permisivo con credenciales | — | ❌ | ✅ | — | — | ✅ | ❌ | — |
| VULN-07 | Secreto JWT hardcodeado | ✅ | ❌ | — | — | — | ❌ | — | — |
| VULN-08 | Dependencia con CVE crítico | — | — | — | ✅ | ✅ | ❌ | — | — |
| VULN-09 | Imagen EOL ejecutando como root | — | — | — | — | ✅ | — | — | — |
| VULN-10 | Cookie de sesión insegura y logout sin revocación | — | ❌ | ✅ | — | — | ✅ | ❌ | — |

### Resumen por herramienta

| Herramienta | Familia | Detectó | Cuáles |
|---|---|---|---|
| Tests de seguridad (escritos a mano) | Pruebas | **7 / 10** | 01, 02, 03, 04, 05, 06, 10 |
| Semgrep, reglas propias | SAST | **6 / 10** | 01, 03, 04, 05, 06, 10 |
| Semgrep, `p/owasp-top-ten` | SAST | **0 / 10** | — |
| ZAP | DAST | 3 / 10 | 01, 03, 05 |
| sqlmap | DAST | 1 / 1 aplicable | 01 |
| gitleaks | Secretos | 1 / 1 aplicable | 07 (solo con la regla propia) |
| npm audit | SCA | 1 / 1 aplicable | 08 |
| Trivy | Contenedor | 2 / 2 aplicables | 08, 09 |

**Las 10 vulnerabilidades fueron detectadas por al menos una herramienta**, así que el job `gate` falla y la protección de `main` bloquea el merge. **Ninguna herramienta, por sí sola, detecta todas.**

## Por qué cada herramienta ve lo que ve

### SAST: Semgrep

- **Los rulesets públicos (`p/owasp-top-ten`) no encontraron ninguna de las 10.** Están escritos para patrones genéricos, por ejemplo la librería `jsonwebtoken` y no `@nestjs/jwt`, y no analizan plantillas Handlebars (`.hbs`).
- **Las 5 reglas propias** (`.semgrep/rules/`) detectan 6 vulnerabilidades, porque están escritas para el código y el stack de este proyecto: `sqli-concat`, `xss-hbs-triple-stash`, `helmet-csp-disabled`, `cors-permissive` y `cookie-insecure`.
- Cada regla propia tiene casos de prueba (`.semgrep/tests/`) que el pipeline ejecuta con `semgrep --test` antes de escanear. Las reglas son código y se prueban como código.
- No puede ver el IDOR (VULN-02): saber que una nota pertenece a otro usuario es lógica de negocio y no se deduce de un patrón de código.

### Secretos: gitleaks

- Escanea **todo el historial**, no solo el último commit. Por eso, una vez que el secreto entró en VULN-07, el job queda en rojo en todos los commits siguientes, y por eso `vulnerable` se crea a partir de `fixed` y no al revés.
- **Con solo sus reglas por defecto no detecta el secreto plantado** ("no leaks found"): el valor no tiene el formato de ningún proveedor ni entropía suficiente. Lo detecta la regla propia `tpi-jwt-secret` de `.gitleaks.toml`.

### SCA y contenedor: npm audit y Trivy

- npm audit detecta `class-validator@0.13.2` (GHSA-fj58-h2fr-3pp2 / CVE-2019-18413, crítico).
- **Trivy también lo detecta**, porque escanea el `node_modules` que queda dentro de la imagen, y no solo los paquetes del sistema operativo.
- Con la imagen vieja (VULN-09), Trivy pasa de 1 a **30 hallazgos HIGH/CRITICAL con fix disponible**: 7 del sistema operativo (OpenSSL, musl, zlib) y 23 de paquetes Node, la mayoría del npm viejo que trae la imagen. Además, `trivy config` marca **DS-0002 "Image user should not be 'root'"**.
- Ninguna otra herramienta ve VULN-09: la app funciona igual con Node 20 y los tests corren en el runner, no dentro de la imagen.

### DAST: ZAP y sqlmap

- ZAP recorre las páginas públicas y hace un escaneo activo acotado a XSS y SQLi. Detecta la SQLi (40018), el XSS reflejado (40012) y la falta de CSP (10038).
- **No detecta el XSS almacenado (VULN-04):** para publicar un comentario hay que estar logueado, y ZAP escanea sin sesión, así que nunca llega a insertar el payload.
- **No detecta el CORS permisivo ni la cookie insegura:** su escaneo no envía un `Origin` ajeno y las páginas que recorre no emiten la cookie de sesión (el login es una API JSON).
- sqlmap confirma la SQLi con dos técnicas (boolean-based blind y UNION) y en segundos.

### Tests de seguridad (escritos a mano)

- Son la herramienta que más cubre (7/10), y **la única que detecta el IDOR**: el test hace login como Bob y pide una nota de Alice.
- No ven dónde está guardado el secreto (VULN-07) ni qué versión de una librería se usa (VULN-08), porque prueban comportamiento, no código ni dependencias.

## Falsos positivos (en `fixed`)

En la rama segura, todos los jobs terminan en verde con los umbrales configurados:

| Herramienta | Resultado en `fixed` | Tratamiento |
|---|---|---|
| gitleaks, Semgrep, Trivy | 0 hallazgos | — |
| npm audit | 4 avisos *moderate* (`hbs`, `glob`, `minimatch`), por debajo del umbral HIGH | `hbs` (GHSA-7f5c-rpf4-86p8) documentado como riesgo aceptado: nunca se pasa `req.query` a `render` |
| ZAP | "Absence of Anti-CSRF Tokens" (10202) en el formulario de comentarios | Bajado a LOW con `alertFilter`. Riesgo aceptado: la cookie es `SameSite=Lax`, así que el navegador no la envía en un POST desde otro sitio |
| ZAP | "User Controllable HTML Element Attribute" (10031), informativa | No bloquea; el valor se escapa |
| Tests | 31 / 31 en verde | — |

Detalle de cada umbral en [umbrales.md](umbrales.md).

## Falsos negativos (en `vulnerable`)

Los ❌ de la matriz son falsos negativos de cada herramienta. Los más relevantes:

- **Semgrep público: 10 de 10.** Sin reglas propias, el SAST no habría detectado nada.
- **ZAP sobre el XSS almacenado, el CORS y la cookie:** un DAST sin autenticación no cubre lo que está detrás del login.
- **gitleaks con reglas por defecto sobre el secreto inventado.**

Ninguno llegó a `main`: en cada caso hubo **otra** herramienta que sí detectó la vulnerabilidad. Ese es el argumento para combinar varias familias de herramientas en lugar de confiar en una sola.

## Tiempos

Duración de cada job en las corridas de los PRs de demo. Los jobs corren en paralelo.

| Job | `fixed` (verde) | `vulnerable` (rojo) |
|---|---|---|
| `secrets` (gitleaks) | 15 s | 8 s |
| `deps` (npm audit) | 12 s | 12 s |
| `build-test` | 21 s | 18 s |
| `sast` (Semgrep) | 30 s | 22 s |
| `image-scan` (Trivy) | 48 s | 61 s |
| `security-tests` | 51 s | 37 s |
| `dast` (ZAP + sqlmap) | 94 s | 100 s |
| `gate` | 4 s | 4 s |
| **Total del pipeline** | **1 min 43 s** | **1 min 49 s** |

Agregar seguridad al CI cuesta menos de dos minutos por cambio. El DAST es la etapa más lenta, porque necesita levantar la app y la base, y aun así cabe en ese tiempo porque el escaneo activo se acotó a XSS y SQLi.

## Conclusiones

1. **Ninguna herramienta lo ve todo.** La mejor (los tests) cubre 7 de 10. Medirlo es lo que evita una falsa sensación de seguridad.
2. **Las reglas genéricas no alcanzan.** Semgrep público detectó 0 de 10 y gitleaks por defecto no vio el secreto. Las reglas propias, escritas para este código, son las que encontraron las fallas.
3. **La lógica de negocio solo la cubren los tests escritos a mano.** El IDOR pasó invisible para SAST, DAST y SCA.
4. **Cada familia cubre un frente distinto:** SAST el código, SCA y Trivy las dependencias y la imagen, DAST la app en ejecución, y los tests el comportamiento esperado.
5. **Combinadas, cubren las 10**, y el pipeline frena el merge de forma automática antes de que el código llegue a `main`.
6. **Ninguna de las 10 rompe el build ni las pruebas funcionales.** Son atajos que "funcionan", del tipo que aparece cuando se genera mucho código rápido, por personas o por agentes de IA. Por eso el control tiene que ser automático y aplicarse igual a cada cambio, sin importar quién lo escribió.

## Mejoras posibles

- Configurar autenticación en ZAP para cubrir las rutas que requieren sesión (VULN-04, VULN-06, VULN-10).
- Activar el escáner de secretos de Trivy (`--scanners vuln,secret`) como segunda capa para VULN-07.
- Publicar el SARIF de Semgrep en GitHub Code Scanning para ver los hallazgos directamente en el PR.

## Corridas de referencia

| Rama | Corrida | Resultado |
|---|---|---|
| `fixed` (PR #2) | [44215501865](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44215501865) | ✅ todo en verde |
| `vulnerable` (PR #1) | [44215422700](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44215422700) | ❌ 7 jobs en rojo, `gate` falla |

Corrida de cada vulnerabilidad, en orden:

| ID | Commit | Corrida | Jobs que se sumaron al rojo |
|---|---|---|---|
| VULN-01 | `091578f` | [44204285897](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44204285897) | `sast`, `security-tests`, `dast` |
| VULN-02 | `2a0ed6e` | [44204914864](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44204914864) | (2 tests nuevos en `security-tests`) |
| VULN-03 | `522b895` | [44205771485](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44205771485) | (hallazgos nuevos en `sast`, `security-tests`, `dast`) |
| VULN-04 | `47dd3a2` | [44206527372](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44206527372) | (hallazgos nuevos en `sast`, `security-tests`) |
| VULN-05 | `a9ba11d` | [44207392661](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44207392661) | (hallazgos nuevos en `sast`, `security-tests`, `dast`) |
| VULN-06 | `ad6ef7e` | [44208504251](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44208504251) | (hallazgos nuevos en `sast`, `security-tests`) |
| VULN-07 | `c10b06e` | [44209088741](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44209088741) | `secrets` |
| VULN-08 | `95a6f2f` | [44210302395](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44210302395) | `deps`, `image-scan` |
| VULN-09 | `b45065b` | [44212218871](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44212218871) | (hallazgos nuevos en `image-scan`) |
| VULN-10 | `dd57084` | [44213805557](https://github.com/tomimorinigo/devsecops-pipeline-nestjs/actions/runs/44213805557) | (hallazgos nuevos en `sast`, `security-tests`) |

# Umbrales del pipeline

| Check | Criterio de aprobación |
| --- | --- |
| `build-test` | Lint, compilación y pruebas unitarias exitosos. |
| `secrets` | Cero hallazgos de Gitleaks en el historial del commit evaluado. Los valores sensibles se ocultan en el reporte. |
| `sast` | Las pruebas de reglas pasan y Semgrep encuentra cero hallazgos de severidad ERROR en el código de la aplicación. |
| `deps` | Cero avisos HIGH o CRITICAL en las dependencias de producción según npm. |
| `security-tests` | Pasan las pruebas de seguridad y el chequeo de salud con PostgreSQL. |
| `image-scan` | Cero vulnerabilidades HIGH o CRITICAL con corrección disponible en la imagen, y cero hallazgos HIGH o CRITICAL en la configuración del Dockerfile. |
| `dast` | ZAP recorre las páginas públicas (requestor + spider), hace análisis pasivo y un escaneo activo acotado a XSS (40012, 40014) y SQLi (40018, 40022). Falla ante alertas MEDIUM o HIGH. sqlmap prueba el parámetro `q` de `/products/search` y falla si encuentra un punto inyectable. |
| `gate` | Todos los jobs anteriores terminaron con éxito. |

Cada etapa de análisis publica su reporte cuando está disponible. El resumen de `gate` muestra el resultado de cada job. Para que el resultado bloquee el merge, el repositorio debe exigir el check `gate` en `main` (paso 6).

ZAP reporta "Absence of Anti-CSRF Tokens" (10202) en el formulario de comentarios. Se baja a LOW con un `alertFilter` porque la cookie de sesión es `SameSite=Lax`, y el navegador no la envía en un POST cross-site. Es un riesgo aceptado hasta implementar tokens CSRF (VULN-13, Ampliación); en ese momento se quita el filtro.

sqlmap no devuelve un código de salida distinto de cero cuando encuentra una inyección. Por eso `scripts/run-sqlmap.sh` revisa el archivo `log` que genera sqlmap y falla si tiene contenido. Usa `--technique=BEU` (boolean, error y UNION) y deja afuera las técnicas basadas en tiempo, para que el job dure segundos.

El umbral de npm deja los avisos moderados en el reporte para revisión. El plan registra el aviso GHSA-7f5c-rpf4-86p8 de `hbs` como riesgo aceptado porque las vistas reciben campos seleccionados explícitamente. Si cambia el renderizado, corresponde reevaluarlo.

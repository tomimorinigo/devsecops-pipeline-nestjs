# Umbrales del pipeline

| Check | Criterio de aprobación |
| --- | --- |
| `build-test` | Lint, compilación y pruebas unitarias exitosos. |
| `secrets` | Cero hallazgos de Gitleaks en el historial del commit evaluado. Los valores sensibles se ocultan en el reporte. |
| `sast` | Las pruebas de reglas pasan y Semgrep encuentra cero hallazgos de severidad ERROR en el código de la aplicación. |
| `deps` | Cero avisos HIGH o CRITICAL en las dependencias de producción según npm. |
| `security-tests` | Pasan las pruebas de seguridad y el chequeo de salud con PostgreSQL. |
| `image-scan` | Cero vulnerabilidades HIGH o CRITICAL con corrección disponible en la imagen, y cero hallazgos HIGH o CRITICAL en la configuración del Dockerfile. |
| `dast` | ZAP analiza de forma pasiva las respuestas a `GET /` y `GET /health`. Falla ante alertas MEDIUM o HIGH. |
| `gate` | Todos los jobs anteriores terminaron con éxito. |

Cada etapa de análisis publica su reporte cuando está disponible. El resumen de `gate` muestra el resultado de cada job. Para que el resultado bloquee el merge, el repositorio debe exigir el check `gate` en `main` (paso 6).

El umbral de npm deja los avisos moderados en el reporte para revisión. El plan registra el aviso GHSA-7f5c-rpf4-86p8 de `hbs` como riesgo aceptado porque las vistas reciben campos seleccionados explícitamente. Si cambia el renderizado, corresponde reevaluarlo.

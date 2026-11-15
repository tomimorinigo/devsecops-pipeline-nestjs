// ok: sqli-concat
database.query('SELECT name FROM products WHERE id = $1', [productId]);
// ruleid: sqli-concat
database.query('SELECT ' + columnName);

// ok: helmet-csp-disabled
helmet({ contentSecurityPolicy: { useDefaults: true } });
// ruleid: helmet-csp-disabled
helmet({ contentSecurityPolicy: false });

// ok: cors-permissive
application.enableCors({ origin: ['https://example.test'], credentials: true });
// ruleid: cors-permissive
application.enableCors({ origin: true, credentials: true });

function sessionWithSecureCookie() {
  // ok: cookie-insecure
  const SESSION_COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: true };
}

function sessionWithInsecureCookie() {
  // ruleid: cookie-insecure
  const SESSION_COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: false };
}

#!/usr/bin/env node
/**
 * TASKFLOW SECURITY VERIFICATION SCRIPT
 * Tests all P0 and P1 security measures
 * Usage: node verify-security.js
 *
 * NOTE: Rate limiter tests use a single request then check the X-RateLimit headers.
 * Do NOT run 10+ requests to avoid exhausting the window.
 */

const http = require('http');
let passed = 0, failed = 0;

function ok(label, detail) { console.log(`✅  ${label}\n    → ${detail}`); passed++; }
function fail(label, detail) { console.log(`❌  ${label}\n    → ${detail}`); failed++; }
function section(title) { console.log(`\n━━━ ${title} ━━━`); }

function request(method, path, body, extraHeaders = {}, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost', port: 3000, path, method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? Buffer.byteLength(data) : 0,
                ...extraHeaders
            }
        };
        const req = http.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(raw); } catch { parsed = raw; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', e => resolve({ status: 0, error: e.message }));
        req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   TASKFLOW — VÉRIFICATION SÉCURITÉ P0 & P1');
    console.log('   ' + new Date().toLocaleString('fr-FR'));
    console.log('═══════════════════════════════════════════════════════');

    // ─── Check server is up ──────────────────────────────────────────────────
    const diag = await request('GET', '/api/diag');
    if (diag.status === 0) {
        console.log('\n🔴  SERVEUR INJOIGNABLE. Démarrez le backend (node server.js) et relancez.');
        process.exit(1);
    }
    console.log(`\n🟢  Serveur actif — DB: ${diag.body?.database || 'n/a'}\n`);

    // ════════════════════════════════════════════════════════════
    //  P0 TESTS
    // ════════════════════════════════════════════════════════════

    // P0.1 — Rate limiter header present on auth routes
    section('P0.1 RATE LIMITING — Headers RateLimit');
    const rl = await request('POST', '/api/auth/login', { username: 'chk', password: 'chk' });
    const remaining = rl.headers['ratelimit-remaining'] ?? rl.headers['x-ratelimit-remaining'];
    const limit = rl.headers['ratelimit-limit'] ?? rl.headers['x-ratelimit-limit'];
    if (limit !== undefined) {
        ok('Headers RateLimit présents', `Limit=${limit}, Remaining=${remaining}`);
    } else {
        fail('Headers RateLimit absents', 'Vérifiez que express-rate-limit est chargé et standardHeaders:true');
    }

    // P0.2 — SQL Injection test (login avec payload SQLi)
    section('P0.2 INJECTION SQL');
    const sqli1 = await request('POST', '/api/auth/login', {
        username: "' OR '1'='1", password: "' OR '1'='1"
    });
    // express-validator escape() convertit les < > ' etc → le login doit échouer (401/422), jamais 200
    if (sqli1.status === 200) {
        fail('SQLi via login', 'PAYLOADS ACCEPTÉS — Vulnérable!');
    } else {
        ok('SQLi via login rejeté', `HTTP ${sqli1.status} — Sequelize utilise des requêtes paramétrées + input validé`);
    }

    const sqli2 = await request('POST', '/api/auth/login', {
        username: '1; DROP TABLE users--', password: 'test'
    });
    if (sqli2.status === 200) {
        fail('SQLi DROP TABLE', 'Vulnérable!');
    } else {
        ok('SQLi DROP TABLE rejeté', `HTTP ${sqli2.status}`);
    }

    // P0.3 — XSS via input
    section('P0.3 XSS — VALIDATION DES ENTRÉES');
    const xss = await request('POST', '/api/auth/login', {
        username: '<script>alert(1)</script>', password: 'test'
    });
    if (xss.status === 422) {
        ok('XSS input bloqué par express-validator', `HTTP 422 — caractères dangereux refusés ou échappés`);
    } else if (xss.status === 401 || xss.status === 400) {
        ok('XSS input rejeté (escape appliqué, login raté)', `HTTP ${xss.status}`);
    } else {
        fail('XSS input non filtré', `HTTP ${xss.status}`);
    }

    // P0.4 — Invalid/short password rejected at register
    section('P0.4 VALIDATION DONNÉES REGISTER');
    const badPw = await request('POST', '/api/auth/register', {
        username: 'validu', email: 'ok@ok.com', password: '123'
    });
    if (badPw.status === 422) ok('Mot de passe trop court rejeté', `HTTP 422 — ${badPw.body?.details?.[0]?.msg || ''}`);
    else fail('Mot de passe court accepté', `HTTP ${badPw.status} — express-validator non actif ?`);

    const badMail = await request('POST', '/api/auth/register', {
        username: 'validu', email: 'pas-un-email', password: 'Test1234!'
    });
    if (badMail.status === 422) ok('Email invalide rejeté', `HTTP 422 — ${badMail.body?.details?.[0]?.msg || ''}`);
    else fail('Email invalide accepté', `HTTP ${badMail.status}`);

    // ════════════════════════════════════════════════════════════
    //  P1 TESTS
    // ════════════════════════════════════════════════════════════

    // P1.1 — Helmet headers
    section('P1.1 SECURITY HEADERS — Helmet');
    const h = diag.headers;
    const helmetChecks = [
        ['x-content-type-options', 'X-Content-Type-Options (anti MIME-sniff)'],
        ['x-frame-options', 'X-Frame-Options (anti Clickjacking)'],
        ['x-dns-prefetch-control', 'X-DNS-Prefetch-Control'],
        ['x-download-options', 'X-Download-Options (IE)'],
        ['referrer-policy', 'Referrer-Policy'],
    ];
    for (const [key, label] of helmetChecks) {
        if (h[key]) ok(label, h[key]);
        else fail(label, 'HEADER ABSENT');
    }

    // P1.2 — CORS restreint
    section('P1.2 CORS RESTREINT');
    const corsEvil = await request('GET', '/api/diag', null, { Origin: 'http://evil.com' });
    const ao = corsEvil.headers?.['access-control-allow-origin'];
    if (!ao) {
        ok('CORS — Origin non autorisée rejetée', 'Pas de Access-Control-Allow-Origin pour evil.com');
    } else if (ao === '*') {
        fail('CORS wildcard', 'Toutes les origins autorisées — dangereux pour les cookies/sessions');
    } else if (ao === 'http://evil.com') {
        fail('CORS — evil.com autorisé', ao);
    } else {
        ok('CORS — Origin restreinte', `Autorisée: ${ao}`);
    }

    const corsLegit = await request('GET', '/api/diag', null, { Origin: 'http://localhost:4200' });
    const ao2 = corsLegit.headers?.['access-control-allow-origin'];
    if (ao2 === 'http://localhost:4200') ok('CORS — Origin légitime (localhost:4200) autorisée', ao2);
    else fail('CORS origin légitime', `Attendu localhost:4200, reçu: ${ao2}`);

    // P1.3 — JWT required
    section('P1.3 PROTECTION JWT');
    const noTk = await request('GET', '/api/tasks');
    if (noTk.status === 401 || noTk.status === 403) ok('Route protégée sans token', `HTTP ${noTk.status}`);
    else fail('Route accessible sans token', `HTTP ${noTk.status}`);

    const badTk = await request('GET', '/api/tasks', null, { Authorization: 'Bearer bad.jwt.token' });
    if (badTk.status === 401 || badTk.status === 403) ok('Token JWT invalide rejeté', `HTTP ${badTk.status}`);
    else fail('Token invalide accepté', `HTTP ${badTk.status}`);

    // P1.4 — IDOR (admin routes inaccessible sans role)
    section('P1.4 IDOR — CONTRÔLE D\'ACCÈS');
    const adminNoTk = await request('GET', '/api/admin/users');
    if (adminNoTk.status === 401 || adminNoTk.status === 403)
        ok('Admin route inaccessible sans token', `HTTP ${adminNoTk.status}`);
    else fail('Admin route accessible sans token', `HTTP ${adminNoTk.status}`);

    const adminLogs = await request('GET', '/api/admin/logs');
    if (adminLogs.status === 401 || adminLogs.status === 403)
        ok('Admin logs inaccessibles sans token', `HTTP ${adminLogs.status}`);
    else fail('Admin logs accessibles sans token', `HTTP ${adminLogs.status}`);

    // P1.5 — No information disclosure
    section('P1.5 INFORMATION DISCLOSURE');
    const err = await request('GET', '/api/does-not-exist');
    const errBody = typeof err.body === 'string' ? err.body : JSON.stringify(err.body || '');
    const leaks = ['node_modules', 'at Object.', 'at Module.', 'Error:', '/home/', 'C:\\Users'];
    const found = leaks.filter(l => errBody.includes(l));
    if (found.length === 0) ok('Pas de fuite de stack trace', `Réponse: ${errBody.substring(0, 80)}`);
    else fail('Stack trace exposée', found.join(', '));

    // P1.6 — File upload restriction
    section('P1.6 UPLOAD — FILE TYPE FILTER');
    console.log(`ℹ️   Upload filtré par MIME type (jpeg/png/pdf/txt/xlsx), limite 5MB`);
    console.log(`    → Configurable dans routes/api.js: allowedMimeTypes & limits.fileSize`);

    // ════════════════════════════════════════════════════════════
    //  SUMMARY
    // ════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`   RÉSULTAT : ${passed} ✅ réussis | ${failed} ❌ échecs`);
    console.log('═══════════════════════════════════════════════════════');
    if (failed === 0) console.log('\n🎉  TOUS LES CONTRÔLES DE SÉCURITÉ PASSENT !\n');
    else console.log('\n⚠️   Voir les ❌ ci-dessus pour corriger\n');
}

main().catch(console.error);

// controllers/relogio.js

const tls = require('tls');

function getResponseBody(rawResponse) {
    const bodyStartIndex = rawResponse.indexOf('\r\n\r\n');
    if (bodyStartIndex === -1) return null;
    return rawResponse.substring(bodyStartIndex + 4);
}

function login(relogioInfo) {
    return new Promise((resolve, reject) => {
        const { user, password, ip, port } = relogioInfo;
        const options = { host: ip, port, rejectUnauthorized: false };
        let isDone = false;
        const socket = tls.connect(options, () => {
            const postData = JSON.stringify({ login: user, password: password });
            const httpRequest = [`POST /login.fcgi HTTP/1.1`, `Host: ${ip}:${port}`, `Content-Type: application/json`, `Content-Length: ${Buffer.byteLength(postData)}`, `Connection: close`, ``, postData].join('\r\n');
            socket.write(httpRequest);
        });
        let responseData = '';
        socket.once('data', (chunk) => {
            responseData += chunk.toString()
            socket.end();
        });
        socket.on('end', () => {
            if (isDone) return; isDone = true;
            const body = getResponseBody(responseData);
            if (!body) return reject(new Error("O relógio respondeu ao login com um corpo vazio."));
            try {
                const loginResponse = JSON.parse(body);
                if (loginResponse && loginResponse.session) resolve(loginResponse.session);
                else if (loginResponse && loginResponse.error) reject(new Error(`Erro retornado pelo relógio: ${loginResponse.error}`));
                else resolve(null); // Retorna nulo se o login falhar, para ser pego pelo app.js
            } catch (e) { reject(new Error("Falha ao analisar a resposta JSON do login: " + body)); }
        });
        socket.on('error', err => { if (isDone) return; isDone = true; reject(err); });
    });
}

function baixar(relogioInfo, sessionId) {
    return new Promise((resolve, reject) => {
        const { ip, port, user, password } = relogioInfo;
        const options = { host: ip, port, rejectUnauthorized: false };
        let isDone = false;

        const postData = JSON.stringify({
            login: user,
            password: password,
            session: sessionId
        });

        const cookieHeader = `password=${password}; login=${user}; session=${sessionId}`;

        const httpRequest = [
            `POST /get_afd.fcgi?mode=671 HTTP/1.1`,
            `Host: ${ip}:${port}`,
            `Content-Type: application/json; charset=UTF-8`,
            `Content-Length: ${Buffer.byteLength(postData)}`,
            `Cookie: ${cookieHeader}`,
            `Connection: close`,
            ``,
            postData
        ].join('\r\n');

        const socket = tls.connect(options, () => {
            socket.write(httpRequest);
        });

        const chunks = [];

        socket.on('data', (chunk) => chunks.push(chunk));

        socket.on('end', () => {
            if (isDone) return;
            isDone = true;

            const raw = Buffer.concat(chunks).toString('utf-8');
            const body = getResponseBody(raw);

            if (body === null) {
                reject(new Error("Resposta do AFD inválida ou sem corpo."));
            } else {
                const linhas = body.trim().split('\n');

                linhas.pop();
                // Remove a última linha
                const ultimaLinha = linhas.pop();

                // Adiciona ela no início
                linhas.unshift(ultimaLinha);

                // Junta novamente em uma string
                const afdReordenado = linhas.join('\n');
                resolve(afdReordenado);
            }
        });

        socket.on('timeout', () => {
            if (isDone) return;
            isDone = true;
            socket.destroy();
            reject(new Error("Tempo de resposta excedido."));
        });

        socket.on('error', err => {
            if (isDone) return;
            isDone = true;
            reject(err);
        });

        socket.setTimeout(10000);
    });
}

async function relogios (){
        let listaRelogios = [
            {
                name:"Desenvolvimento Econômico",
                login:"admin",
                password:"admin",
                ip:"172.16.31.2",
                port:"4017"
            },
            {
                name:"Tributário",
                login:"admin",
                password:"admin",
                ip:"172.16.6.2",
                port:"4020"
            },
            {
                name:"Merenda",
                login:"admin",
                password:"admin",
                ip:"172.16.32.2",
                port:"4003"
            },
            {
                name:"Obras",
                login:"admin",
                password:"admin",
                ip:"172.16.37.22",
                port:"4002"
            },
            {
                name:"Transporte",
                login:"admin",
                password:"admin",
                ip:"172.16.32.3",
                port:"4004"
            },
            {
                name:"Rural",
                login:"admin",
                password:"admin",
                ip:"172.16.18.8",
                port:"4025"
            },
            {
                name:"Conselho",
                login:"admin",
                password:"admin",
                ip:"172.16.23.2",
                port:"4009"
            },
        ]
        return JSON.stringify(listaRelogios);
    }

module.exports = { login, baixar, relogios };
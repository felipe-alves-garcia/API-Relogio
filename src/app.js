// app.js
console.log("--- PROVA DE QUE O SERVIDOR REINICIOU COM O CÓDIGO NOVO ---");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const relogio = require("./controllers/relogio");

app.get("/baixar-afd/:user/:password/:ip/:port", async (req, res) => {
    
    const relogioInfo = {
        user: req.params.user,
        password: req.params.password,
        ip: req.params.ip,
        port: req.params.port,
    };

    try {
        console.log("ETAPA 1: Tentando fazer login...");
        const sessionId = await relogio.login(relogioInfo);
        //const sessionId = "B7IqATe4BU2Y5MVIlR2ndir2"

        // VERIFICAÇÃO DE SEGURANÇA
        console.log("ETAPA 1.5: Verificando a sessão recebida...");
        if (!sessionId || sessionId.trim() === "") {
            // Se a sessão for nula, o código para aqui e lança este erro.
            throw new Error("Login falhou. Verifique o usuário e a senha.");
        }
        console.log("Login bem-sucedido! ID da Sessão obtido:"+sessionId);

        console.log("ETAPA 2: Tentando baixar o arquivo AFD...");
        const afdData = await relogio.baixar(relogioInfo, sessionId);
        console.log("Download do AFD bem-sucedido!");

        res.setHeader('Content-Disposition', 'attachment; filename=AFD.txt');
        res.setHeader('Content-Type', 'text/plain');
        res.send(afdData);

    } catch (error) {
        console.error("[ERRO NO FLUXO]:", error.message);
        // O erro é enviado ao navegador e aparece no alerta.
        res.status(500).send("Falha no processo: " + error.message);
    }
});

/*const PORT = 7777;
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}.`);
});*/

module.exports = app;
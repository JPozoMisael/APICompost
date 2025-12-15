const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const app = express();

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/static', express.static(path.join(__dirname, 'static')));

// Rutas principales
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/sensor", require("./routes/sensor.routes"));
app.use("/api/alertas", require("./routes/alerta.routes"));
app.use("/api/usuarios", require("./routes/usuario.routes"));
app.use("/api/reportes", require("./routes/reporte.routes"));
app.use("/api/dispositivos", require("./routes/dispositivo.routes"));
app.use("/api/fuzzy", require("./routes/fuzzy.routes"));
app.use("/api/logs", require("./routes/logs.routes"));
app.use("/api/health", require("./routes/health.routes"));
app.use("/api/parametros", require("./routes/parametros.routes"));
app.use("/api/notificaciones", require("./routes/notificaciones.routes"));
app.use("/api/config-sistema", require("./routes/config-sistema.routes"));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API IoT funcionando correctamente.");
});

module.exports = app;

// backend/src/controllers/alerta.controller.js
const AlertasModel = require('../models/alerta.model');
const { enviarNotificacionMultiple } = require('../services/firebase.service'); // Importa enviarNotificacionMultiple

exports.getAlertas = async (req, res) => {
  try {
    const soloNoLeidas = req.query.soloNoLeidas === '1' || req.query.soloNoLeidas === 'true';

    const filas = await AlertasModel.listar({ soloNoLeidas });

    // Adaptamos al formato que usa tu front (interface Alerta)
    const data = filas.map(row => ({
      id: String(row.id),
      tipo: row.tipo || 'warning',
      descripcion: row.mensaje || '',
      fecha: row.fecha ? row.fecha.toISOString() : null,
      critico: row.nivel === 'danger' || row.nivel === 'critico',
      leida: !!row.leida,
      // si algún día quieres usar estos:
      dispositivo_id: row.dispositivo_id,
      nivel: row.nivel,
      usuario_id: row.usuario_id,
      lectura_id: row.lectura_id,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error en getAlertas:', err);
    res.status(500).json({ msg: 'Error al obtener alertas' });
  }
};

exports.crearAlerta = async (req, res) => {
  try {
    const {
      dispositivo_id,
      tipo,
      descripcion,   // viene del front
      mensaje,       // opcional, por si algún día usas "mensaje"
      nivel,
      fecha,
      leida,
      usuario_id,
      lectura_id,
      critico,
    } = req.body || {};

    const nuevo = await AlertasModel.crear({
      dispositivo_id,
      tipo: tipo || 'warning',
      mensaje: mensaje || descripcion || '',
      nivel: nivel || (critico ? 'danger' : 'info'),
      fecha: fecha ? new Date(fecha) : new Date(),
      leida: leida ? 1 : 0,
      usuario_id,
      lectura_id,
    });

    // devolver adaptado al formato del front
    const alertaFormateada = {
      id: String(nuevo.id),
      tipo: nuevo.tipo,
      descripcion: nuevo.mensaje,
      fecha: nuevo.fecha ? new Date(nuevo.fecha).toISOString() : new Date().toISOString(),
      critico: nuevo.nivel === 'danger' || nuevo.nivel === 'critico',
      leida: !!nuevo.leida,
    };

    res.status(201).json(alertaFormateada);

    // 🚀 Enviar notificación push (Firebase)
    try {
      // Buscar el token del dispositivo del usuario
      const tokens = await AlertasModel.getTokensDispositivo(usuario_id);

      if (tokens && tokens.length > 0) {
        const titulo = critico ? '⚠️ Alerta crítica' : 'Alerta';
        const mensaje = descripcion || mensaje || 'Nueva alerta detectada';

        // Enviar la notificación push
        const resultado = await enviarNotificacionMultiple(tokens, { // Usa enviarNotificacionMultiple
          titulo,
          mensaje,
          datos: {
            tipo: tipo || 'warning',
            alertaId: String(nuevo.id),
            critico: String(critico), // Firebase necesita strings
          },
        });

        console.log('✅ Notificación push enviada:', resultado);
      } else {
        console.warn('No se encontró token de dispositivo para el usuario:', usuario_id);
      }
    } catch (error) {
      console.error('❌ Error al enviar notificación push:', error);
    }

  } catch (err) {
    console.error('Error en crearAlerta:', err);
    res.status(500).json({ msg: 'Error al crear alerta' });
  }
};

exports.marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await AlertasModel.marcarComoLeida(id);

    if (!ok) {
      return res.status(404).json({ msg: 'Alerta no encontrada' });
    }

    res.json({ msg: 'Alerta marcada como leída' });
  } catch (err) {
    console.error('Error en marcarComoLeida:', err);
    res.status(500).json({ msg: 'Error al actualizar alerta' });
  }
};

exports.guardarTokenDispositivo = async (req, res) => {
  try {
    const { usuario_id, token } = req.body;

    if (!usuario_id || !token) {
      return res.status(400).json({ msg: 'Faltan usuario_id o token' });
    }

    await AlertasModel.guardarTokenDispositivo(usuario_id, token);
    res.status(201).json({ msg: 'Token guardado correctamente' });

  } catch (error) {
    console.error('Error al guardar token:', error);
    res.status(500).json({ msg: 'Error al guardar token' });
  }
};
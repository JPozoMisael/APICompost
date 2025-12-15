const FuzzyModel = require('../models/fuzzy.model');
const { enviarNotificacionMultiple } = require('../services/firebase.service');

let accionesCache = []; //  Cache para guardar las acciones previamente leídas

const getAccionesDifusas = async (req, res) => {
  try {
    // ✅ Soporta: /api/fuzzy?limit=200&offset=0
    const limit = Math.min(Math.max(toInt(req.query.limit, 200), 1), 1000);
    const offset = Math.max(toInt(req.query.offset, 0), 0);

    const acciones = await FuzzyModel.getAcciones({ limit, offset });

    // 🚀 Enviar notificación push (Firebase) por cada nueva acción
    try {
      const nuevasAcciones = acciones.filter(
        (accion) => !accionesCache.find((a) => a.id === accion.id)
      );

      if (nuevasAcciones.length > 0) {
        const tokens = await FuzzyModel.getTodosLosTokens();

        if (tokens && tokens.length > 0) {
          for (const accion of nuevasAcciones) {
            const titulo = '✅ Nueva acción automática';
            const mensaje = accion.descripcion || 'Nueva acción automática detectada';

            const resultado = await enviarNotificacionMultiple(tokens, {
              titulo,
              mensaje,
              datos: {
                tipo: 'accion_fuzzy',
                accionId: String(accion.id),
                estado: 'aplicada',
              },
            });

            console.log('✅ Notificación push enviada:', resultado);
          }
        } else {
          console.warn(
            'No se encontraron tokens de dispositivo para enviar la notificación de acción fuzzy'
          );
        }
      }

      // Actualizar el cache con las acciones leídas
      accionesCache = acciones;
    } catch (error) {
      console.error('❌ Error al enviar notificación push:', error);
    }

    return res.json(acciones);
  } catch (error) {
    console.error('Error en getAccionesDifusas:', error);
    return res.status(200).json([]); // nunca 500 al front
  }
};

const getAccionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const accion = await FuzzyModel.getAccionById(id);
    if (!accion) return res.status(404).json({ mensaje: 'Acción no encontrada' });
    return res.json(accion);
  } catch (error) {
    console.error('Error en getAccionPorId:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const insertarAccion = async (_descripcion) => {
  try {
    return null; // No-OP (según tu diseño actual)
  } catch (error) {
    console.error('FuzzyModel.insertarAccion error:', error);
    return null;
  }
};

const aplicarAccionDifusa = async (_id) => {
  try {
    return true; // No-OP
  } catch (error) {
    console.error('FuzzyModel.aplicarAccionDifusa error:', error);
    return false;
  }
};

function toInt(v, def) {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
}

module.exports = {
  getAccionesDifusas,
  getAccionPorId,
  insertarAccion,
  aplicarAccionDifusa,
};
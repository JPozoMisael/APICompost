const AlertaController = require('./alerta.controller');
const FuzzyController = require('./fuzzy.controller');

exports.getNotificaciones = async (req, res) => {
  try {
    // Obtener las alertas
    const alertas = await AlertaController.getAlertas(req, res);

    // Obtener las acciones difusas
    const acciones = await FuzzyController.getAcciones(req, res);

    // Combinar las alertas y las acciones difusas
    const notificaciones = [...alertas, ...acciones];

    // Devolver las notificaciones
    res.json(notificaciones);
  } catch (error) {
    console.error('Error en getNotificaciones:', error);
    res.status(500).json({ msg: 'Error al obtener las notificaciones' });
  }
};
const admin = require('firebase-admin');

// Inicializar Firebase Admin (solo una vez)
let firebaseApp;

try {
  // Verificar si ya está inicializado
  if (admin.apps.length === 0) {
    let credential;

    // Opción 1: Usar variable de entorno con credenciales JSON
    if (process.env.FIREBASE_ADMIN_SDK_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CREDENTIALS);
      credential = admin.credential.cert(serviceAccount);
    }
    // Opción 2: Usar credenciales predeterminadas (recomendado para Cloud Run, App Engine, Cloud Functions)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
      credential = admin.credential.applicationDefault();
    }
    // Opción 3: Variables de entorno individuales
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
    }
    else {
      throw new Error('No se encontraron credenciales de Firebase. Configura FIREBASE_ADMIN_SDK_CREDENTIALS o las variables individuales.');
    }

    firebaseApp = admin.initializeApp({
      credential,
      // Opcional: si necesitas especificar el proyecto
      // projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
  } else {
    firebaseApp = admin.app();
    console.log('✅ Firebase Admin SDK ya estaba inicializado');
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error.message);
  console.error('Stack:', error.stack);
  throw error; // En producción, es mejor lanzar el error para que el proceso falle rápido
}

/**
 * Enviar notificación push a un token específico
 * @param {string} token - FCM token del dispositivo
 * @param {Object} options - Opciones de la notificación
 * @param {string} options.titulo - Título de la notificación
 * @param {string} options.mensaje - Cuerpo de la notificación
 * @param {Object} options.datos - Datos adicionales
 * @returns {Promise<Object>} Resultado del envío
 */
async function enviarNotificacion(token, { titulo, mensaje, datos = {} }) {
  if (!firebaseApp) {
    const error = new Error('Firebase no está inicializado');
    console.error('❌', error.message);
    throw error;
  }

  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido o no proporcionado');
  }

  const message = {
    token,
    notification: {
      title: titulo,
      body: mensaje,
    },
    data: {
      // Convertir todos los valores a string (requisito de FCM)
      ...Object.entries(datos).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      }, {}),
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: datos.critico ? 'alertas_criticas' : 'alertas_generales',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notificación enviada exitosamente:', response);
    return { 
      success: true, 
      messageId: response,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error.message);
    console.error('Código de error:', error.code);
    
    // Manejo de errores específicos
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('⚠️ Token inválido o no registrado, considera eliminarlo de tu BD');
    }
    
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Enviar notificaciones a múltiples tokens
 */
async function enviarNotificacionMultiple(tokens, { titulo, mensaje, datos = {} }) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('Debe proporcionar un array de tokens válido');
  }

  // FCM permite hasta 500 tokens por batch
  const batchSize = 500;
  const results = [];

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.all(
        batch.map(token => enviarNotificacion(token, { titulo, mensaje, datos }))
      );
      results.push(...batchResults);
    } catch (error) {
      console.error(`❌ Error en batch ${i / batchSize + 1}:`, error.message);
    }
  }

  const exitosos = results.filter(r => r.success).length;
  const fallidos = results.filter(r => !r.success).length;

  console.log(`📊 Resumen: ${exitosos} exitosos, ${fallidos} fallidos de ${tokens.length} totales`);

  return {
    total: tokens.length,
    exitosos,
    fallidos,
    resultados: results
  };
}

module.exports = {
  enviarNotificacion,
  enviarNotificacionMultiple,
  admin, // Por si necesitas acceder a otras funcionalidades de admin
};
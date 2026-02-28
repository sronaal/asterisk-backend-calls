const { getLicenseStatus } = require('./licenseValidator');

/**
 * Middleware para proteger rutas de API basado en el estado de la licencia.
 * Bloquea el acceso si la licencia es inválida o ha expirado.
 */
const licenseGuard = (req, res, next) => {
    const status = getLicenseStatus();

    if (!status.valid || status.expired) {
        return res.status(403).json({
            error: 'ACCESO_DENEGADO',
            message: 'Licencia inválida o expirada. Por favor, renueve su licencia para continuar.',
            license_status: status
        });
    }

    next();
};

module.exports = licenseGuard;

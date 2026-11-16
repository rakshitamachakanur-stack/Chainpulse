/**
 * Lightweight helper so controllers can emit real-time events
 * without importing the server directly.
 *
 * Usage in a controller:
 *   const emit = require('../middleware/socketEmit');
 *   emit(req, 'order:updated', { id: o._id, status: o.status });
 */
module.exports = function emit(req, event, payload = {}) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

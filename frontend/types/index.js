import PropTypes from 'prop-types';

export const SeatZonePropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  capacity: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['full-day', 'half-day', 'reading-area', 'computer-zone', 'quiet-study', 'group-study']).isRequired,
  status: PropTypes.oneOf(['active', 'inactive', 'maintenance']).isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  updatedAt: PropTypes.instanceOf(Date).isRequired
});

export const SystemSettingsPropTypes = PropTypes.shape({
  theme: PropTypes.oneOf(['light', 'dark', 'system']).isRequired,
  notificationsEnabled: PropTypes.bool.isRequired,
  emailNotifications: PropTypes.bool.isRequired,
  smsNotifications: PropTypes.bool.isRequired,
  timeZone: PropTypes.string.isRequired,
  dateFormat: PropTypes.string.isRequired,
  maintenanceMode: PropTypes.bool.isRequired,
  sessionTimeout: PropTypes.number.isRequired,
  passwordPolicy: PropTypes.shape({
    minLength: PropTypes.number.isRequired,
    requireUppercase: PropTypes.bool.isRequired,
    requireNumbers: PropTypes.bool.isRequired,
    requireSpecialChars: PropTypes.bool.isRequired
  }).isRequired,
  security: PropTypes.shape({
    enable2FA: PropTypes.bool.isRequired,
    maxLoginAttempts: PropTypes.number.isRequired,
    lockoutDuration: PropTypes.number.isRequired
  }).isRequired,
  appearance: PropTypes.shape({
    primaryColor: PropTypes.string.isRequired,
    compactMode: PropTypes.bool.isRequired,
    showSeconds: PropTypes.bool.isRequired
  }).isRequired
}); 
import { Library, BookOpen, School } from "lucide-react";
import PropTypes from 'prop-types';

// Properties will be fetched from API
export const properties = [];

export const propertyShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  logo: PropTypes.any.isRequired,
  logoColor: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  seats: PropTypes.number.isRequired,
  students: PropTypes.number.isRequired,
  revenue: PropTypes.number.isRequired
}); 
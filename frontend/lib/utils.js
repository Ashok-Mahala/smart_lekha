import PropTypes from 'prop-types';
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const classValuePropTypes = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool,
  PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool
  ])),
  PropTypes.object
]);

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

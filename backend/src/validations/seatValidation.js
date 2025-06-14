// Placeholder functions for basic validation (optional)
function isValidSeat(seat) {
  return seat &&
    typeof seat.propertyId === 'string' &&
    typeof seat.seatNumber === 'string' &&
    typeof seat.row === 'string' &&
    typeof seat.column === 'number' &&
    ['standard', 'premium', 'handicap', 'other'].includes(seat.type) &&
    Array.isArray(seat.features);
}

function validateBulkCreate(input) {
  return Array.isArray(input.seats) &&
    input.seats.length > 0 &&
    input.seats.every(isValidSeat);
}

function validateBookSeat(input) {
  return input &&
    typeof input.studentId === 'string' &&
    (input.until === undefined || !isNaN(Date.parse(input.until)));
}

function validateReserveSeat(input) {
  return input &&
    typeof input.studentId === 'string' &&
    !isNaN(Date.parse(input.until));
}

function validateUpdateStatus(input) {
  return input &&
    ['available', 'occupied', 'reserved', 'maintenance'].includes(input.status);
}

module.exports = {
  validateBulkCreate,
  validateBookSeat,
  validateReserveSeat,
  validateUpdateStatus
};

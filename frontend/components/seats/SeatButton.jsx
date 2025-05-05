import { Sofa } from "lucide-react";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

const SeatButton = ({ seat, selected, onSelect, side = "left" }) => {
  const baseColor = side === "left" ? "blue" : "purple";

  return (
    <button
      key={seat.id}
      className={cn(
        "w-8 h-8 md:w-12 md:h-12 rounded-t-lg border-2 flex items-center justify-center relative transition-all",
        `border-${baseColor}-500 bg-${baseColor}-50 hover:bg-${baseColor}-100`,
        seat.status === "available" && "bg-green-50 hover:bg-green-100",
        seat.status === "occupied" && "border-red-500 bg-red-50 cursor-not-allowed",
        seat.status === "reserved" && "border-amber-500 bg-amber-50 cursor-not-allowed",
        seat.status === "maintenance" && "border-slate-400 bg-slate-100 cursor-not-allowed",
        selected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onClick={() => seat.status === "available" && onSelect(seat.id)}
      disabled={seat.status !== "available"}
      title={seat.user}
    >
      <Sofa
        className={cn(
          "h-4 w-4 md:h-6 md:w-6",
          `text-${baseColor}-600`,
          seat.status === "available" && "text-green-600",
          seat.status === "occupied" && "text-red-600",
          seat.status === "reserved" && "text-amber-600",
          seat.status === "maintenance" && "text-slate-500"
        )}
      />
      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[8px] md:text-xs font-bold">
        {seat.number}
      </span>
      {seat.status === "reserved" && seat.timeRemaining && (
        <span className="absolute -top-4 md:-top-6 left-0 right-0 text-[8px] md:text-[10px] text-amber-600 font-medium">
          {seat.timeRemaining}m
        </span>
      )}
    </button>
  );
};

SeatButton.propTypes = {
  seat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['available', 'occupied', 'reserved', 'maintenance']).isRequired,
    user: PropTypes.string,
    timeRemaining: PropTypes.number
  }).isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  side: PropTypes.oneOf(['left', 'right'])
};

export default SeatButton;

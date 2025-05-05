import { Badge } from "@/components/ui/badge";

const SeatLegend = () => (
  <div className="flex flex-wrap gap-2 mb-4">
    <Badge variant="outline" className="bg-white border-green-500 text-green-600">
      Available
    </Badge>
    <Badge variant="outline" className="bg-red-100 border-red-500 text-red-600">
      Occupied
    </Badge>
    <Badge variant="outline" className="bg-amber-100 border-amber-500 text-amber-600">
      Reserved
    </Badge>
    <Badge variant="outline" className="bg-slate-100 border-slate-400 text-slate-500">
      Maintenance
    </Badge>
  </div>
);

export default SeatLegend;

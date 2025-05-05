import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropTypes from "prop-types";

const ShiftSelector = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full sm:w-[180px]">
      <SelectValue placeholder="Select shift" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="morning">Morning (07AM-02PM)</SelectItem>
      <SelectItem value="evening">Evening (02PM-10PM)</SelectItem>
      <SelectItem value="lateEvening">Late Evening (02PM-12AM)</SelectItem>
      <SelectItem value="fullDay1">Full Day (07AM-12AM)</SelectItem>
      <SelectItem value="fullDay2">Full Day (07AM-10PM)</SelectItem>
    </SelectContent>
  </Select>
);

ShiftSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ShiftSelector;

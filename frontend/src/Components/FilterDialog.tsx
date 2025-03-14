import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Filter } from "lucide-react";

const FilterDialog = ({ filterDialogOpen, setFilterDialogOpen }) => (
  <Dialog
    open={filterDialogOpen}
    onClose={() => setFilterDialogOpen(false)}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle className="bg-gray-50">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-[#F8BC08]" />
        <span className="font-semibold">Add New Filter</span>
      </div>
    </DialogTitle>
    <DialogContent className="mt-4">
      <div className="space-y-4">
        <TextField fullWidth label="Username" variant="outlined" />
        <TextField fullWidth label="Account Details" variant="outlined" />
        <FormControl fullWidth>
          <InputLabel>Filter Reason</InputLabel>
          <Select label="Filter Reason">
            <MenuItem value="overpayment">Overpayment</MenuItem>
            <MenuItem value="negative">Negative Feedback</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
      </div>
    </DialogContent>
    <DialogActions className="bg-gray-50 p-4">
      <Button
        onClick={() => setFilterDialogOpen(false)}
        className="text-gray-600"
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        sx={{ bgcolor: "#F8BC08", "&:hover": { bgcolor: "#C6980C" } }}
      >
        Add Filter
      </Button>
    </DialogActions>
  </Dialog>
);

export default FilterDialog;

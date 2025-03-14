import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  VisibilityOff as InactiveIcon,
  Visibility as ActiveIcon,
} from "@mui/icons-material";
import {
  getAllTemplates,
  deleteTemplate,
  toggleTemplateStatus,
} from "../../api/autoTemplates";

const AllTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    type: "",
    platform: "",
    isActive: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getAllTemplates({
        ...filters,
        search: searchTerm || undefined,
      });
      if (response?.success) {
        setTemplates(response.data);
        setTotalCount(response.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters, searchTerm]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (templateToDelete) {
        await deleteTemplate(templateToDelete.id);
        fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleStatusToggle = async (template) => {
    try {
      await toggleTemplateStatus(template.id, !template.isActive);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const getStatusColor = (isActive) =>
    isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

  return (
    <div className="p-6 max-w-[1400px] mx-auto font-primary">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5" className="text-foreground font-bold">
          Message Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/message-templates/create")}
          className="bg-button hover:bg-primary2 text-foreground"
        >
          Create Template
        </Button>
      </div>

      {/* Filters Section */}
      <Paper elevation={0} className="p-4 mb-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField
            fullWidth
            size="small"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon className="mr-2 text-text2" />,
            }}
            className="bg-background"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="bg-background"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="welcome">Welcome</MenuItem>
              <MenuItem value="payment_made">Payment Made</MenuItem>
              <MenuItem value="coin_release">Coin Release</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Platform</InputLabel>
            <Select
              value={filters.platform}
              label="Platform"
              onChange={(e) =>
                setFilters({ ...filters, platform: e.target.value })
              }
              className="bg-background"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="paxful">Paxful</MenuItem>
              <MenuItem value="noones">Noones</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.isActive}
              label="Status"
              onChange={(e) =>
                setFilters({ ...filters, isActive: e.target.value })
              }
              className="bg-background"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Paper>

      {/* Table Section */}
      <Paper elevation={0} className="bg-background">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-semibold text-foreground">
                  Type
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Platform
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Content
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Variables
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Status
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Tags
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-8">
                    <CircularProgress className="text-button" />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    className="py-8 text-text2"
                  >
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell className="text-foreground">
                        {template.type}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {template.platform}
                      </TableCell>
                      <TableCell className="text-foreground max-w-md">
                        <Typography noWrap>{template.content}</Typography>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {template.availableVariables?.length || 0}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.isActive ? "Active" : "Inactive"}
                          className={`${getStatusColor(template.isActive)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.tags?.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              className="bg-button text-foreground text-xs"
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() =>
                                navigate(
                                  `/message-templates/edit/${template.id}`
                                )
                              }
                              className="text-button hover:text-primary2"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDeleteClick(template)}
                              className="text-destructive hover:text-red-700"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          className="border-t border-border"
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography className="text-foreground">
            Are you sure you want to delete this template?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            className="text-text2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            className="text-destructive"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AllTemplates;

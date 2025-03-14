import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  AccessTime as ClockIcon,
  LocalOffer as TagIcon,
} from "@mui/icons-material";
import { createTemplate } from "../../api/autoTemplates";

const MessageTemplateForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    content?: string;
    type?: string;
    platform?: string;
  }>({});

  const [formData, setFormData] = useState({
    type: "welcome",
    platform: "paxful",
    content: "",
    availableVariables: [],
    followUpDelayMinutes: 0,
    followUpContent: [],
    isActive: true,
    displayOrder: 0,
    feedbackTemplates: [],
    tags: [],
  });

  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVariable, setNewVariable] = useState({
    name: "",
    description: "",
    defaultValue: "",
  });
  const [newTag, setNewTag] = useState("");

  const validateForm = () => {
    const errors: any = {};

    if (!formData.content.trim()) {
      errors.content = "Message content is required";
    }
    if (!formData.type) {
      errors.type = "Template type is required";
    }
    if (!formData.platform) {
      errors.platform = "Platform is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const templateData = {
        ...formData,
        followUpDelayMinutes: Number(formData.followUpDelayMinutes),
        displayOrder: Number(formData.displayOrder),
      };

      const response = await createTemplate(templateData);

      if (response?.success) {
        navigate("/admin/message-templates");
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariable = () => {
    if (newVariable.name && newVariable.description) {
      setFormData({
        ...formData,
        availableVariables: [...formData.availableVariables, newVariable],
      });
      setNewVariable({ name: "", description: "", defaultValue: "" });
      setShowVariableModal(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag],
      });
      setNewTag("");
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-primary">
      <Paper elevation={0} className="p-6 bg-background">
        <Typography
          variant="h5"
          sx={{ mb: 4 }}
          className="mb-6 text-foreground font-bold"
        >
          Create Message Template
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormControl fullWidth error={!!formErrors.type}>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={formData.type}
                label="Template Type"
                onChange={(e) => handleFieldChange("type", e.target.value)}
                className="bg-background"
                required
              >
                <MenuItem value="welcome">Welcome</MenuItem>
                <MenuItem value="payment_made">Payment Made</MenuItem>
                <MenuItem value="coin_release">Coin Release</MenuItem>
              </Select>
              {formErrors.type && (
                <Typography variant="caption" color="error">
                  {formErrors.type}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={!!formErrors.platform}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={formData.platform}
                label="Platform"
                onChange={(e) => handleFieldChange("platform", e.target.value)}
                className="bg-background"
                required
              >
                <MenuItem value="paxful">Paxful</MenuItem>
                <MenuItem value="noones">Noones</MenuItem>
              </Select>
              {formErrors.platform && (
                <Typography variant="caption" color="error">
                  {formErrors.platform}
                </Typography>
              )}
            </FormControl>
          </div>

          {/* Message Content */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message Content"
            value={formData.content}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            className="bg-background"
            required
            error={!!formErrors.content}
            helperText={formErrors.content}
          />

          {/* Variables Section */}
          <Box className="space-y-4">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" className="text-foreground">
                Available Variables
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowVariableModal(true)}
                className="text-button hover:text-primary2"
              >
                Add Variable
              </Button>
            </div>

            <div className="space-y-2">
              {formData.availableVariables.map((variable, index) => (
                <Paper
                  key={index}
                  className="p-3 flex justify-between items-center bg-background"
                >
                  <div>
                    <Typography variant="subtitle2" className="text-foreground">
                      {variable.name}
                    </Typography>
                    <Typography variant="body2" className="text-text2">
                      {variable.description}
                    </Typography>
                  </div>
                  <IconButton
                    onClick={() => {
                      const updatedVariables = [...formData.availableVariables];
                      updatedVariables.splice(index, 1);
                      setFormData({
                        ...formData,
                        availableVariables: updatedVariables,
                      });
                    }}
                    className="text-destructive"
                  >
                    <RemoveIcon />
                  </IconButton>
                </Paper>
              ))}
            </div>
          </Box>

          {/* Follow-up Settings */}
          <Box className="space-y-2">
            <div className="flex items-center">
              <ClockIcon className="mr-2 text-text2" />
              <Typography variant="subtitle1" className="text-foreground">
                Follow-up Delay (minutes)
              </Typography>
            </div>
            <TextField
              type="number"
              fullWidth
              value={formData.followUpDelayMinutes}
              onChange={(e) =>
                handleFieldChange(
                  "followUpDelayMinutes",
                  parseInt(e.target.value)
                )
              }
              inputProps={{ min: 0 }}
              className="bg-background"
            />
          </Box>

          {/* Tags */}
          <Box className="space-y-2">
            <div className="flex items-center">
              <TagIcon className="mr-2 text-text2" />
              <Typography variant="subtitle1" className="text-foreground">
                Tags
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => {
                    const updatedTags = formData.tags.filter(
                      (_, i) => i !== index
                    );
                    setFormData({ ...formData, tags: updatedTags });
                  }}
                  className="bg-button text-foreground"
                />
              ))}
            </div>
            <div className="flex gap-2">
              <TextField
                fullWidth
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="bg-background"
              />
              <Button
                onClick={addTag}
                variant="contained"
                className="bg-button hover:bg-primary2 text-foreground"
              >
                Add
              </Button>
            </div>
          </Box>

          {/* Active Status */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isActive}
                onChange={(e) =>
                  handleFieldChange("isActive", e.target.checked)
                }
                className="text-button"
              />
            }
            label="Active Template"
          />

          {/* Submit Button */}
          <Box className="flex justify-end">
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              className={`bg-button hover:bg-primary2 text-foreground ${
                isSubmitting ? "opacity-50" : ""
              }`}
            >
              {isSubmitting ? (
                <Box className="flex items-center">
                  <CircularProgress size={20} className="mr-2" />
                  Saving...
                </Box>
              ) : (
                "Save Template"
              )}
            </Button>
          </Box>
        </form>

        {/* Variable Modal */}
        <Dialog
          open={showVariableModal}
          onClose={() => setShowVariableModal(false)}
        >
          <DialogTitle className="text-foreground">Add Variable</DialogTitle>
          <DialogContent className="space-y-4">
            <TextField
              fullWidth
              label="Variable Name"
              value={newVariable.name}
              onChange={(e) =>
                setNewVariable({ ...newVariable, name: e.target.value })
              }
              className="mt-4 bg-background"
            />
            <TextField
              fullWidth
              label="Description"
              value={newVariable.description}
              onChange={(e) =>
                setNewVariable({ ...newVariable, description: e.target.value })
              }
              className="bg-background"
            />
            <TextField
              fullWidth
              label="Default Value (Optional)"
              value={newVariable.defaultValue}
              onChange={(e) =>
                setNewVariable({ ...newVariable, defaultValue: e.target.value })
              }
              className="bg-background"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowVariableModal(false)}
              className="text-text2"
            >
              Cancel
            </Button>
            <Button
              onClick={addVariable}
              className="text-button hover:text-primary2"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default MessageTemplateForm;

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { createEscalatedTrade } from "../../api/escalatedTrade";

interface EscalationModalProps {
  open: boolean;
  onClose: () => void;
  escalateData: {
    tradeId: string;
    platform: string;
    amount: number;
    assignedPayerId: string;
    escalatedById: string;
    tradeHash: string;
  };
}

interface EscalationFormValues {
  complaint: string;
  additionalNotes: string;
  tradeId: string;
  tradeHash: string;
  platform: string;
  amount: number;
  assignedPayerId: string;
  escalatedById: string;
}

const complaintOptions = [
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "DELIVERY_DELAY", label: "Delivery Delay" },
  { value: "QUALITY_ISSUE", label: "Quality Issue" },
  { value: "COMMUNICATION_ISSUE", label: "Communication Issue" },
  { value: "OTHER", label: "Other" },
];

const validationSchema = Yup.object().shape({
  complaint: Yup.string().required("Please select a complaint type"),
});

const EscalateTrade: React.FC<EscalationModalProps> = ({
  open,
  onClose,
  escalateData,
}) => {
  const initialValues: EscalationFormValues = {
    complaint: "Payment Issue",
    additionalNotes: "",
    tradeHash: escalateData.tradeHash,
    tradeId: escalateData.tradeId,
    amount: escalateData.amount,
    escalatedById: escalateData.escalatedById,
    assignedPayerId: escalateData.assignedPayerId,
    platform: escalateData.platform,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className="rounded-lg"
    >
      <DialogTitle className="bg-gray-50 border-b">
        Escalate Trade #{escalateData.tradeHash}
      </DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(false);
          const data = await createEscalatedTrade({
            ...values,
            tradeHash: escalateData.tradeHash,
            tradeId: escalateData.tradeId,
          });
          if (data?.success) {
            onClose();
          }
        }}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form>
            <DialogContent className="py-4">
              <div className="space-y-4">
                <Field name="complaint">
                  {({ field }: any) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Complaint"
                      error={touched.complaint && Boolean(errors.complaint)}
                      helperText={touched.complaint && errors.complaint}
                    >
                      {complaintOptions.map((option) => (
                        <MenuItem key={option.label} value={option.label}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Field>

                <Field name="additionalNotes">
                  {({ field }: any) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Additional Notes (Optional)"
                      error={
                        touched.additionalNotes &&
                        Boolean(errors.additionalNotes)
                      }
                      helperText={
                        touched.additionalNotes && errors.additionalNotes
                      }
                    />
                  )}
                </Field>
              </div>
            </DialogContent>

            <DialogActions className="bg-gray-50 border-t p-4">
              <Button onClick={onClose} className="text-gray-600">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                Escalate Trade
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default EscalateTrade;

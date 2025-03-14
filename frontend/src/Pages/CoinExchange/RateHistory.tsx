import React from "react";
import { Card, CardContent, Typography, Box, styled } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RateHistoryCard = styled(Card)(({ theme }) => ({
  borderRadius: "12px",
  marginBottom: theme.spacing(3),
  border: "1px solid #E5E7EB",
}));

interface RateHistoryProps {
  data: Array<{
    time: string;
    rate: number;
  }>;
  lastUpdate: string;
}

const RateHistory: React.FC<RateHistoryProps> = ({ data, lastUpdate }) => {
  return (
    <RateHistoryCard>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Rate History
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last Update: {lastUpdate}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" tickLine={false} />
              <YAxis
                stroke="#6B7280"
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "Rate",
                ]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#FFB800"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#FFB800" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </RateHistoryCard>
  );
};

export default RateHistory;

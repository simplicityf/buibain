import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface ComplaintData {
  complaintId: string;
  platform: string;
  submittedBy: {
    name: string;
  };
  type: string;
  status: string;
  date: string;
  priority: string;
  description: string;
}

interface EscalatedTradeData {
  tradeId: string;
  platform: string;
  escalatedBy: {
    fullName: string;
  };
  amount: string;
  status: string;
  createdAt: string;
  complaint: string;
}

export const exportToCSV = (
  data: any[],
  type: "completedTrades" | "escalatedTrades"
) => {
  let headers: string[] = [];
  let csvData: any[] = [];

  if (type === "completedTrades") {
    headers = [
      "Complaint ID",
      "Platform",
      "Submitted By",
      "Type",
      "Status",
      "Date",
      "Priority",
      "Description",
    ];
    csvData = data.map((item: ComplaintData) => [
      item.complaintId,
      item.platform,
      item.submittedBy.name,
      item.type,
      item.status,
      item.date,
      item.priority,
      item.description,
    ]);
  } else {
    headers = [
      "Trade ID",
      "Platform",
      "Escalated By",
      "Amount",
      "Status",
      "Date",
      "Complaint",
    ];
    csvData = data.map((item: EscalatedTradeData) => [
      item.tradeId,
      item.platform,
      item.escalatedBy.fullName,
      item.amount,
      item.status,
      new Date(item.createdAt).toLocaleDateString(),
      item.complaint,
    ]);
  }

  const csvContent = [headers, ...csvData]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${type}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
  data: any[],
  type: "completedTrades" | "escalatedTrades"
) => {
  const doc = new jsPDF();

  const title =
    type === "completedTrades"
      ? "Customer Complaints Report"
      : "Escalated Trades Report";
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

  let headers: string[] = [];
  let tableData: any[] = [];

  if (type === "completedTrades") {
    headers = [
      "ID",
      "Platform",
      "Submitted By",
      "Type",
      "Status",
      "Date",
      "Priority",
      "Description",
    ];
    tableData = data.map((item: ComplaintData) => [
      item.complaintId,
      item.platform,
      item.submittedBy.name,
      item.type,
      item.status,
      item.date,
      item.priority,
      item.description,
    ]);
  } else {
    headers = [
      "Trade ID",
      "Platform",
      "Escalated By",
      "Amount",
      "Status",
      "Date",
      "Complaint",
    ];
    tableData = data.map((item: EscalatedTradeData) => [
      item.tradeId,
      item.platform,
      item.escalatedBy.fullName,
      item.amount,
      item.status,
      new Date(item.createdAt).toLocaleDateString(),
      item.complaint,
    ]);
  }

  (doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      7: { cellWidth: 40 },
    },
  });

  doc.save(`${type}_${new Date().toISOString().split("T")[0]}.pdf`);
};

import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  File,
  FileDown,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

const formatLocalDate = (dateStr: string | Date | null | undefined, includeTime = true) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  if (includeTime) {
    return d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MedicalReport } from "@shared/schema";

const reportTypes = [
  { value: "blood_test", label: "Blood Test" },
  { value: "lab_report", label: "Lab Report" },
  { value: "urine_test", label: "Urine Test" },
  { value: "lipid_profile", label: "Lipid Profile" },
  { value: "liver_function", label: "Liver Function Test" },
  { value: "kidney_function", label: "Kidney Function Test" },
  { value: "thyroid", label: "Thyroid Panel" },
  { value: "cbc", label: "Complete Blood Count (CBC)" },
  { value: "other", label: "Other" },
];

export default function MedicalReports() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [reportText, setReportText] = useState("");
  const [reportType, setReportType] = useState("blood_test");
  const [fileName, setFileName] = useState("");
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previousFile, setPreviousFile] = useState<File | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "compare">("file");
  const [comparisonType, setComparisonType] = useState<"analysis" | "table">(
    "analysis",
  );
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevFileInputRef = useRef<HTMLInputElement>(null);
  const currFileInputRef = useRef<HTMLInputElement>(null);

  const userIdNum = userId ? parseInt(userId) : undefined;

  const { data: reports, isLoading } = useQuery<MedicalReport[]>({
    queryKey: [`/api/reports/user/${userIdNum}`],
    enabled: !!userIdNum,
  });

  const createReport = useMutation({
    mutationFn: async (data: {
      userId: number;
      reportType: string;
      fileName?: string;
      reportText: string;
    }) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reports/user/${userIdNum}`],
      });
      setReportText("");
      setFileName("");
      toast({
        title: "Report uploaded",
        description:
          "Your medical report has been saved. Click 'Analyze' to get AI insights.",
      });
    },
  });

  const analyzeReport = useMutation({
    mutationFn: async (reportId: number) => {
      setAnalyzingId(reportId);
      const res = await apiRequest("POST", `/api/reports/${reportId}/analyze`, {
        userId: userIdNum,
      });
      return res.json();
    },
    onSuccess: (data, reportId) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reports/user/${userIdNum}`],
      });
      setExpandedReport(reportId);
      setAnalyzingId(null);
      toast({
        title: "Analysis complete",
        description: "Your report has been analyzed successfully.",
      });
    },
    onError: () => {
      setAnalyzingId(null);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reports/user/${userIdNum}`],
      });
      toast({
        title: "Report deleted",
        description: "The medical report has been removed.",
      });
    },
  });

  const downloadReportPDF = (report: MedicalReport) => {
    const doc = new jsPDF();
    const reportDate = formatLocalDate(report.createdAt, false);
    const reportTypeName =
      reportTypes.find((t) => t.value === report.reportType)?.label ||
      "Medical Report";

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Medical Report Analysis", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Generated by MedVoice AI on ${format(new Date(), "MMM d, yyyy")}`,
      105,
      28,
      { align: "center" },
    );

    // Report Details Section
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Report Details", 20, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Type: ${reportTypeName}`, 20, 52);
    doc.text(`File Name: ${report.fileName || "N/A"}`, 20, 57);
    doc.text(`Report Date: ${reportDate}`, 20, 62);
    doc.text(`Patient ID: ${report.userId}`, 20, 67);

    // Analysis Content
    doc.line(20, 75, 190, 75);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AI Analysis & Insights", 20, 85);

    doc.setFontSize(10);
    const splitAnalysis = (report.analysis || "No analysis available.").split(
      "\n",
    );
    let currentY = 95;

    // Detect and render tables in PDF
    const hasTable =
      report.analysis?.includes("|") && report.analysis?.includes("---");
    if (hasTable) {
      const rows = report
        .analysis!.split("\n")
        .filter((row) => row.includes("|"));
      const tableHeaders = rows[0]
        .split("|")
        .filter((c) => c.trim() && !c.includes("---"))
        .map((c) => c.trim());
      const tableData = rows
        .filter(
          (row) =>
            !row.includes("---") && !row.toLowerCase().includes("parameter"),
        )
        .map((row) =>
          row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim()),
        );

      if (tableHeaders.length > 0 && tableData.length > 0) {
        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: currentY,
          theme: "striped",
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 20, right: 20 },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Filter out table rows from the rest of the analysis rendering
      const nonTableText = report
        .analysis!.split("\n")
        .filter((line) => !line.includes("|"))
        .join("\n");
      const splitNonTable = nonTableText.split("\n");

      splitNonTable.forEach((line: string) => {
        let cleanLine = line.replace(/\*\*/g, "").trim();
        if (!cleanLine) return;

        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const wrappedLine = doc.splitTextToSize(cleanLine, 170);
        wrappedLine.forEach((subLine: string) => {
          if (currentY > 280) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(subLine, 20, currentY);
          currentY += 5;
        });
      });
    } else {
      splitAnalysis.forEach((line: string) => {
        // Existing line-by-line rendering logic...
        let cleanLine = line
          .replace(/\*\*/g, "")
          .replace(/\|/g, "")
          .replace(/--+/g, "")
          .trim();
        if (!cleanLine) return;

        // Regular headings - highlight these normally (bold + specific color)
        const isHeading =
          /Significant Increments:|Significant Decrements:|Improvements or Deteriorations in Health Status:|Concerning Trends That Need Medical Attention:|Overall Assessment:|Recommendations:|Parameter Analysis:|Analysis:|Detailed Analysis:|Overall Assessment & Recommendations:|Reason Specified:|Signature Verification:|Probable Causes:|Precautions:|Immediate Actions:|When to Worry:|Recommended Doctor Consultation:|Follow Up:/i.test(
            cleanLine,
          );

        if (isHeading) {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text(cleanLine.replace(/:$/, ""), 20, currentY);
          currentY += 8;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const wrappedLine = doc.splitTextToSize(cleanLine, 170);
          wrappedLine.forEach((subLine: string) => {
            if (currentY > 280) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(subLine, 20, currentY);
            currentY += 5;
          });
        }
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, 105, 285, { align: "center" });
      doc.text(
        "Disclaimer: This AI-generated report is for informational purposes only. Consult a doctor for medical diagnosis.",
        105,
        290,
        { align: "center" },
      );
    }

    doc.save(
      `MedVoice_Analysis_${report.fileName?.split(".")[0] || "Report"}.pdf`,
    );
  };

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", String(userIdNum));
      formData.append("reportType", reportType);

      const res = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reports/user/${userIdNum}`],
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Report uploaded",
        description:
          "Your medical report has been uploaded and processed. Click 'Analyze' to get AI insights.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description:
          error.message || "Could not process the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!userIdNum) return;

    if (uploadMode === "file") {
      if (!selectedFile) {
        toast({
          title: "No file selected",
          description: "Please select a PDF or text file to upload.",
          variant: "destructive",
        });
        return;
      }
      uploadFile.mutate(selectedFile);
    } else {
      if (!reportText.trim()) {
        toast({
          title: "Missing information",
          description: "Please paste or type your medical report text.",
          variant: "destructive",
        });
        return;
      }
      createReport.mutate({
        userId: userIdNum,
        reportType,
        fileName: fileName || undefined,
        reportText: reportText.trim(),
      });
    }
  };

  const [selectedPrevReportId, setSelectedPrevReportId] = useState<string>("");
  const [selectedCurrReportId, setSelectedCurrReportId] = useState<string>("");

  const handleCompare = async () => {
    if (!selectedPrevReportId || !selectedCurrReportId || !userIdNum) return;

    setIsComparing(true);
    setComparisonResult(null);

    try {
      const prevReport = reports?.find(
        (r) => String(r.id) === selectedPrevReportId,
      );
      const currReport = reports?.find(
        (r) => String(r.id) === selectedCurrReportId,
      );

      if (!prevReport || !currReport) {
        throw new Error("Selected reports not found");
      }

      const res = await apiRequest("POST", "/api/reports/compare", {
        userId: userIdNum,
        previousText: prevReport.reportText,
        currentText: currReport.reportText,
        comparisonType: comparisonType,
        previousDate: prevReport.createdAt,
        currentDate: currReport.createdAt,
        previousFileName: prevReport.fileName,
        currentFileName: currReport.fileName,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Comparison failed");
      }

      const data = await res.json();
      setComparisonResult(data.comparison);
      toast({
        title: "Comparison complete",
        description: "AI has analyzed the changes between your reports.",
      });
    } catch (error: any) {
      toast({
        title: "Comparison failed",
        description:
          error.message || "Could not compare reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const formatComparisonResult = (text: string) => {
    if (!text) return null;

    // Remove all double asterisks (markdown bold) and table characters
    let cleanText = text.replace(/\*\*/g, "");
    cleanText = cleanText.replace(/\|/g, "");
    cleanText = cleanText.replace(/--+/g, "");

    // Split by common headings and wrap them in styled divs
    const parts = cleanText.split(
      /(Significant Increments:|Significant Decrements:|Improvements or Deteriorations in Health Status:|Concerning Trends That Need Medical Attention:|Overall Assessment:|Recommendations:|Parameter Analysis:|Reason Specified:|Signature Verification:|Probable Causes:|Precautions:|Immediate Actions:|When to Worry:|Recommended Doctor Consultation:|Follow Up:)/i,
    );

    return parts.map((part, index) => {
      const isHeading =
        /Significant Increments:|Significant Decrements:|Improvements or Deteriorations in Health Status:|Concerning Trends That Need Medical Attention:|Overall Assessment:|Recommendations:|Parameter Analysis:|Reason Specified:|Signature Verification:|Probable Causes:|Precautions:|Immediate Actions:|When to Worry:|Recommended Doctor Consultation:|Follow Up:/i.test(
          part,
        );

      if (isHeading) {
        return (
          <div
            key={index}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-md font-bold text-sm mt-4 mb-2 inline-block"
          >
            {part.replace(/:$/, "")}
          </div>
        );
      }

      // Clean up the line content
      const lines = part
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return (
        <div key={index} className="mb-2 leading-relaxed space-y-1">
          {lines.map((line, lIndex) => {
            // Fix reversed logic in interpretation (e.g., "Increased from X to Y" when Y < X)
            let displayLine = line;
            if (
              line.toLowerCase().includes("increased from") ||
              line.toLowerCase().includes("decreased from")
            ) {
              const numbers = line.match(/(\d+(\.\d+)?)/g);
              if (numbers && numbers.length >= 2) {
                const val1 = parseFloat(numbers[0]);
                const val2 = parseFloat(numbers[1]);
                if (
                  val2 < val1 &&
                  line.toLowerCase().includes("increased from")
                ) {
                  displayLine = line.replace(
                    /increased from/i,
                    "Decreased from",
                  );
                } else if (
                  val2 > val1 &&
                  line.toLowerCase().includes("decreased from")
                ) {
                  displayLine = line.replace(
                    /decreased from/i,
                    "Increased from",
                  );
                }
              }
            }

            let cleanDisplay = displayLine.replace(/^[-*]\s*/, "");
            cleanDisplay = cleanDisplay.replace(
              /^\*{0,2}Recommendation:?\*{0,2}\s*/i,
              "",
            );

            const subheadingMatch = cleanDisplay.match(/^([^:]+):/);
            if (subheadingMatch && subheadingMatch[1].length < 60) {
              const label = subheadingMatch[1];
              const rest = cleanDisplay.substring(label.length + 1);
              return (
                <div
                  key={lIndex}
                  className="pl-2 border-l-2 border-slate-100 py-1"
                >
                  <span className="font-bold text-slate-900">{label}:</span>
                  <span className="ml-1 text-slate-700">{rest}</span>
                </div>
              );
            }

            return (
              <div
                key={lIndex}
                className="pl-2 border-l-2 border-slate-100 py-0.5"
              >
                <span className="text-slate-500 mr-2">•</span>
                {cleanDisplay}
              </div>
            );
          })}
        </div>
      );
    });
  };

  const renderComparisonResult = (text: string) => {
    if (!text) return null;

    if (comparisonType === "table" && text.includes("|")) {
      const allLines = text.split("\n");
      const tableRows = allLines.filter((row) => row.includes("|"));
      const nonTableLines = allLines
        .filter((row) => !row.includes("|") && !row.includes("---"))
        .join("\n")
        .trim();

      return (
        <div className="space-y-6">
          {tableRows.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    {tableRows[0]
                      .split("|")
                      .filter((c) => c.trim() && !c.includes("---"))
                      .map((header, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 border-r border-slate-200 last:border-0"
                        >
                          {header.trim()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows
                    .filter(
                      (row) =>
                        !row.includes("---") &&
                        !row.toLowerCase().includes("parameters"),
                    )
                    .map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        {row
                          .split("|")
                          .filter((c) => c.trim())
                          .map((cell, j) => (
                            <td
                              key={j}
                              className="px-4 py-3 border-r border-slate-100 last:border-0"
                            >
                              {cell.trim()}
                            </td>
                          ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {nonTableLines && (
            <div className="mt-4">{renderStandardText(nonTableLines)}</div>
          )}
        </div>
      );
    }

    return formatReportAnalysis(text);
  };

  const formatReportAnalysis = (text: string) => {
    if (!text) return null;

    let cleaned = text.replace(/```\s*markdown\s*/gi, "").replace(/```/g, "");
    cleaned = cleaned.replace(/^\s*\n/, "");

    const rawLines = cleaned.split("\n");
    const lines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const trimmed = rawLines[i].trim();
      if (trimmed.startsWith("|") && !trimmed.endsWith("|")) {
        let merged = rawLines[i];
        while (i + 1 < rawLines.length) {
          const nextTrimmed = rawLines[i + 1].trim();
          if (nextTrimmed === "") break;
          i++;
          merged += " " + rawLines[i].trim();
          if (nextTrimmed.endsWith("|")) break;
        }
        lines.push(merged);
      } else {
        lines.push(rawLines[i]);
      }
    }
    const hasTableRows =
      lines.filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith("|") &&
          trimmed.endsWith("|") &&
          !trimmed.match(/^\|[-\s|]+\|$/)
        );
      }).length >= 2;

    if (!hasTableRows) {
      return renderStandardText(text);
    }

    const result: React.ReactNode[] = [];
    let currentNonTable: string[] = [];
    let tableRows: string[] = [];
    let partIndex = 0;

    const flushNonTable = () => {
      if (currentNonTable.length > 0) {
        const joined = currentNonTable.join("\n");
        if (joined.trim()) {
          result.push(
            <div key={`text-${partIndex++}`}>{renderStandardText(joined)}</div>,
          );
        }
        currentNonTable = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length < 2) {
        currentNonTable.push(...tableRows);
        tableRows = [];
        return;
      }
      flushNonTable();
      const dataRows = tableRows.filter(
        (row) => !row.trim().match(/^\|[-\s|]+\|$/),
      );
      const headerRow = dataRows[0];
      const bodyRows = dataRows.slice(1).filter((row) => {
        const firstCell =
          row
            .split("|")
            .filter((c) => c.trim())[0]
            ?.trim()
            .toLowerCase() || "";
        return firstCell !== "parameter" && firstCell !== "test name";
      });

      const headers = headerRow.split("|").filter((c) => c.trim());
      result.push(
        <div
          key={`table-${partIndex++}`}
          className="overflow-x-auto border border-slate-200 rounded-lg my-4"
        >
          <table className="w-full text-sm text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 border-r border-slate-200 last:border-0"
                  >
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  {row
                    .split("|")
                    .filter((c) => c.trim())
                    .map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 py-3 border-r border-slate-100 last:border-0"
                      >
                        {cell.trim()}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      tableRows = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|");
      const isSeparator = trimmed.match(/^\|[-\s|]+\|$/);

      if (isTableLine || isSeparator) {
        tableRows.push(line);
      } else {
        if (tableRows.length > 0) {
          flushTable();
        }
        currentNonTable.push(line);
      }
    }

    if (tableRows.length > 0) flushTable();
    flushNonTable();

    return result;
  };

  const renderStandardText = (text: string) => {
    if (!text) return null;

    let cleanText = text.replace(/```\s*markdown\s*/gi, "").replace(/```/g, "");
    cleanText = cleanText.replace(/\*\*/g, "");
    cleanText = cleanText.replace(/\|/g, "");
    cleanText = cleanText.replace(/--+/g, "");

    cleanText = cleanText.replace(/#+\s*/g, "");

    const headingPattern =
      /(Significant Increments and Significant Decrements|Significant Increments \(Increases\)|Significant Decrements \(Decreases\)|Significant Increments|Significant Decrements|Improvements or Deteriorations in Health Status|Concerning Trends That Need Medical Attention|Overall Assessment & Recommendations|Overall Assessment and Recommendations|Overall Risk Assessment and Recommendations|Overall Assessment|Recommendations|Parameter Analysis|Detailed Analysis|Lab Values Breakdown|Reason Specified|Signature Verification|Probable Causes|Precautions|Immediate Actions|When to Worry|Recommended Doctor Consultation|Follow Up)/i;
    const parts = cleanText.split(headingPattern);

    const seenHeadings = new Set<string>();
    return parts.map((part, index) => {
      const isHeading = headingPattern.test(part);

      if (isHeading) {
        const normalizedHeading = part.trim().toLowerCase();
        if (seenHeadings.has(normalizedHeading)) {
          return null;
        }
        seenHeadings.add(normalizedHeading);
        
        const canonicalNames: Record<string, string> = {
          "probable causes": "Probable Causes",
          "precautions": "Precautions",
          "immediate actions": "Immediate Actions",
          "when to worry": "When to Worry",
          "recommended doctor consultation": "Recommended Doctor Consultation",
          "follow up": "Follow Up",
          "reason specified": "Reason Specified",
          "signature verification": "Signature Verification",
          "overall assessment & recommendations": "Overall Assessment & Recommendations",
          "overall assessment and recommendations": "Overall Assessment & Recommendations",
          "overall risk assessment and recommendations": "Overall Assessment & Recommendations",
          "overall assessment": "Overall Assessment",
        };
        const displayName = canonicalNames[normalizedHeading] || part.trim();
        
        return (
          <div
            key={index}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-md font-bold text-sm mt-4 mb-2 inline-block"
          >
            {displayName}
          </div>
        );
      }

      // Clean up the line content
      const rawLines = part
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 0 &&
            line !== ":" &&
            line !== "•" &&
            line !== "&" &&
            line !== "and",
        );

      const lines: string[] = [];
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const isBulletOrHeading = /^[-*•]/.test(line) || /^[A-Z][^:]+:/.test(line);
        const prevLine = lines.length > 0 ? lines[lines.length - 1] : null;
        const prevEndsIncomplete = prevLine && !/[.!?:)\d%]$/.test(prevLine.trimEnd());

        if (prevEndsIncomplete && !isBulletOrHeading) {
          lines[lines.length - 1] = prevLine + " " + line;
        } else {
          lines.push(line);
        }
      }

      return (
        <div key={index} className="mb-2 leading-relaxed space-y-1">
          {lines.map((line, lIndex) => {
            // Fix reversed logic in interpretation (e.g., "Increased from X to Y" when Y < X)
            let displayLine = line;
            if (
              line.toLowerCase().includes("increased from") ||
              line.toLowerCase().includes("decreased from")
            ) {
              const numbers = line.match(/(\d+(\.\d+)?)/g);
              if (numbers && numbers.length >= 2) {
                const val1 = parseFloat(numbers[0]);
                const val2 = parseFloat(numbers[1]);
                if (
                  val2 < val1 &&
                  line.toLowerCase().includes("increased from")
                ) {
                  displayLine = line.replace(
                    /increased from/i,
                    "Decreased from",
                  );
                } else if (
                  val2 > val1 &&
                  line.toLowerCase().includes("decreased from")
                ) {
                  displayLine = line.replace(
                    /decreased from/i,
                    "Increased from",
                  );
                }
              }
            }

            // Check if it's a parameter detail line (starts with - or *)
            let cleanDisplay = displayLine.replace(/^[-*]\s*/, "");

            // Strip "Recommendation:" prefix so actual category label becomes the bold heading
            cleanDisplay = cleanDisplay.replace(
              /^\*{0,2}Recommendation:?\*{0,2}\s*/i,
              "",
            );

            // Identify subheadings within the text (labels before a colon)
            const subheadingMatch = cleanDisplay.match(/^([^:]+):/);
            if (subheadingMatch && subheadingMatch[1].length < 60) {
              const label = subheadingMatch[1];
              const rest = cleanDisplay.substring(label.length + 1);
              return (
                <div
                  key={lIndex}
                  className="pl-2 border-l-2 border-slate-100 py-1"
                >
                  <span className="font-bold text-slate-900">{label}:</span>
                  <span className="ml-1 text-slate-700">{rest}</span>
                </div>
              );
            }

            return (
              <div
                key={lIndex}
                className="pl-2 border-l-2 border-slate-100 py-0.5"
              >
                <span className="text-slate-500 mr-2">•</span>
                {cleanDisplay}
              </div>
            );
          })}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="loading-spinner"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/assistant"
            className="p-2 hover:bg-white rounded-full transition-colors"
            data-testid="link-back"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">
              Medical Reports
            </h1>
            <p className="text-slate-500">
              Upload and analyze your lab reports
            </p>
          </div>
        </header>

        <Card className="mb-8" data-testid="card-upload">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <Button
                variant={uploadMode === "file" ? "secondary" : "ghost"}
                onClick={() => setUploadMode("file")}
                className="flex-1"
                data-testid="button-mode-file"
              >
                <File className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant={uploadMode === "compare" ? "secondary" : "ghost"}
                onClick={() => setUploadMode("compare")}
                className="flex-1"
                data-testid="button-mode-compare"
              >
                <Activity className="w-4 h-4 mr-2" />
                Compare Reports
              </Button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Select File (PDF, Image, or Text)
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      selectedFile
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-file"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.png,.jpg,.jpeg,text/plain,application/pdf,image/png,image/jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <File className="w-10 h-10 text-primary" />
                        <p className="font-medium text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          data-testid="button-clear-file"
                        >
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-slate-400" />
                        <p className="font-medium text-slate-700">
                          Click to upload a file
                        </p>
                        <p className="text-sm text-slate-400">
                          PDF, PNG, JPEG, or TXT files up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={uploadFile.isPending || !selectedFile}
                  className="w-full"
                  data-testid="button-upload"
                >
                  {uploadFile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {selectedFile?.type.startsWith("image/") ||
                      selectedFile?.type === "application/pdf"
                        ? "Extracting text with OCR..."
                        : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Report
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <Activity className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Compare two medical reports with MedGemma AI
                    </p>
                    <p className="text-xs text-blue-700">
                      Select two existing reports to see what has changed over
                      time.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-700">
                        Type of Comparison
                      </label>
                    </div>
                    <Select
                      value={comparisonType}
                      onValueChange={(val: any) => setComparisonType(val)}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                        <SelectValue placeholder="Select comparison type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">
                          Analysis Comparison
                        </SelectItem>
                        <SelectItem value="table">Table Comparison</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-700">
                        Report 1 (Prev Report)
                      </label>
                    </div>
                    <Select
                      value={selectedPrevReportId}
                      onValueChange={setSelectedPrevReportId}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                        <SelectValue placeholder="Select first report" />
                      </SelectTrigger>
                      <SelectContent>
                        {reports?.map((report) => (
                          <SelectItem key={report.id} value={String(report.id)}>
                            {report.fileName || formatLocalDate(report.createdAt, false)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-700">
                        Report 2 (Current Report)
                      </label>
                    </div>
                    <Select
                      value={selectedCurrReportId}
                      onValueChange={setSelectedCurrReportId}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                        <SelectValue placeholder="Select second report" />
                      </SelectTrigger>
                      <SelectContent>
                        {reports?.map((report) => (
                          <SelectItem key={report.id} value={String(report.id)}>
                            {report.fileName || formatLocalDate(report.createdAt, false)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={
                    isComparing ||
                    !selectedPrevReportId ||
                    !selectedCurrReportId
                  }
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Comparing Reports...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Compare Reports with AI
                    </>
                  )}
                </Button>

                {comparisonResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                  >
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Comparison Analysis
                    </h4>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {comparisonResult
                        ? renderComparisonResult(comparisonResult)
                        : null}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Reports</h2>

          {!reports?.length ? (
            <div
              className="text-center py-16 bg-white rounded-2xl border border-slate-100"
              data-testid="empty-state"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-slate-500">No reports uploaded yet.</p>
              <p className="text-sm text-slate-400 mt-1">
                Upload a medical report to get started.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {reports.map((report) => {
                const isExpanded = expandedReport === report.id;

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                    data-testid={`report-card-${report.id}`}
                  >
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() =>
                        setExpandedReport(isExpanded ? null : report.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {report.fileName ||
                              reportTypes.find(
                                (t) => t.value === report.reportType,
                              )?.label ||
                              "Medical Report"}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {formatLocalDate(report.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {report.analysis ? (
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                              Analyzed
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeReport.mutate(report.id);
                              }}
                              disabled={analyzingId === report.id}
                              data-testid={`button-reanalyze-${report.id}`}
                              className="text-xs text-slate-500 hover:text-primary"
                            >
                              {analyzingId === report.id
                                ? "Re-analyzing..."
                                : "Re-analyze"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              analyzeReport.mutate(report.id);
                            }}
                            disabled={analyzingId === report.id}
                            data-testid={`button-analyze-${report.id}`}
                          >
                            {analyzingId === report.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              "Analyze"
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-300 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this report?")) {
                              deleteReport.mutate(report.id);
                            }
                          }}
                          data-testid={`button-delete-${report.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-100"
                        >
                          <div className="p-5 space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-slate-500 mb-2">
                                Report Text
                              </h4>
                              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {report.reportText}
                              </div>
                            </div>

                            {report.analysis ? (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium text-slate-500">
                                    AI Analysis
                                  </h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadReportPDF(report)}
                                    className="h-8 gap-2"
                                    data-testid={`button-download-pdf-${report.id}`}
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    Download PDF
                                  </Button>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                                  {report.analysis
                                    ? formatReportAnalysis(report.analysis)
                                    : "Analysis in progress..."}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Button
                                  onClick={() =>
                                    analyzeReport.mutate(report.id)
                                  }
                                  disabled={analyzingId === report.id}
                                  data-testid={`button-analyze-expanded-${report.id}`}
                                >
                                  {analyzingId === report.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Analyzing Report...
                                    </>
                                  ) : (
                                    "Analyze This Report"
                                  )}
                                </Button>
                                <p className="text-xs text-slate-400 mt-2">
                                  Get detailed AI analysis of each parameter
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

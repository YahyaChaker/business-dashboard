import React, { useState, useEffect, useRef } from 'react';
import { FileText} from 'lucide-react';
import styles from "./ui/KPIandBilling.module.css";
import KpiDonutGauge from './KpiDonutGauge';
import * as XLSX from 'xlsx';

// Types
interface KPIData {
  month: string;
  kpiScore: number;
  baseBill: number;
  kpiDeductionRate: number;
  kpiDeduction: number;
  penalty: number;
  netInvoice: number;
  riskScore: number;
  delayedWorkOrders: number;
  costEfficiency: number;
  qualityScore: number;
  safetyIndex: number;
}

interface BillingData {
  month: string;
  status: string;
  submittedDate: string;
  submittedAmount: number;
  certifiedAmount: number | null;
  disputedAmount: number | null;
  received: string;
  notes: string;
  processingTime: number | null;
  paymentDelay: number | null;
}

interface Metrics {
  totalBaseBill: number;
  totalDeductions: number;
  totalPenalties: number;
  avgKpiScore: number;
  totalSubmitted: number;
  totalCertified: number;
  totalDisputed: number;
  certificationRate: number;
  disputeRate: number;
  recoveryRate: number;
  avgDeductionPercentage: number;
  paymentRate: number;
  riskIndex: number;
  kpiTrend: number;
  totalImpact: number;
  impactPercentage: number;
}

const KpiFinanceDashboard: React.FC = () => {
  // State
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  
  // Refs
  const metricsContainerRef = useRef<HTMLDivElement>(null);
  const kpiGaugeRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const formatCurrency = (value: number): string => 
    `QAR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const calculateMetrics = (): Metrics | null => {
    if (!kpiData.length || !billingData.length) return null;

    // Filter active rows first
    const activeKpiData = kpiData.filter(item => item.baseBill > 0);
    
    const totalBaseBill = activeKpiData.reduce((sum, item) => sum + (item.baseBill || 0), 0);
    const totalDeductions = activeKpiData.reduce((sum, item) => sum + (item.kpiDeduction || 0), 0);
    const totalPenalties = activeKpiData.reduce((sum, item) => sum + (item.penalty || 0), 0);
    // Calculate average KPI score only for active months
    const avgKpiScore = activeKpiData.reduce((sum, item) => sum + (item.kpiScore || 0), 0) / activeKpiData.length;
    
    const totalSubmitted = billingData.reduce((sum, item) => sum + (item.submittedAmount || 0), 0);
    const totalCertified = billingData.reduce((sum, item) => sum + (item.certifiedAmount || 0), 0);
    const totalDisputed = billingData.reduce((sum, item) => sum + (item.disputedAmount || 0), 0);
    
    const certificationRate = totalSubmitted ? (totalCertified / totalSubmitted * 100) : 0;
    const disputeRate = totalSubmitted ? (totalDisputed / totalSubmitted * 100) : 0;
    const recoveryRate = (totalCertified + totalDisputed) ? (totalCertified / (totalCertified + totalDisputed) * 100) : 0;
    const avgDeductionPercentage = totalBaseBill ? (totalDeductions / totalBaseBill * 100) : 0;
    
    const paidInvoices = billingData.filter(item => item.received === "Yes").length;
    const totalProcessedInvoices = billingData.filter(item => item.status !== "Under preparation").length;
    const paymentRate = totalProcessedInvoices > 0 ? (paidInvoices / totalProcessedInvoices) * 100 : 0;
    
    const riskIndex = (disputeRate * 0.4) + ((100 - avgKpiScore) * 0.6);
    
    const kpiTrend = kpiData.length >= 2 ? kpiData[kpiData.length - 1].kpiScore - kpiData[0].kpiScore : 0;
    
    return {
      totalBaseBill,
      totalDeductions,
      totalPenalties,
      avgKpiScore,
      totalSubmitted,
      totalCertified,
      totalDisputed,
      certificationRate,
      disputeRate,
      recoveryRate,
      avgDeductionPercentage,
      paymentRate,
      riskIndex,
      kpiTrend,
      totalImpact: totalDeductions + totalPenalties,
      impactPercentage: (totalDeductions + totalPenalties) / totalBaseBill * 100
    };
  };

  useEffect(() => {
    const loadExcelData = async () => {
      try {
        const response = await fetch('Project Performance Template.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellStyles: true,
          cellDates: true,
          cellNF: true,
        });

        // Get KPI data and extract months
        const kpiSheet = workbook.Sheets['KPI-Penalties'];

        // Helper function to safely get cell value
        const getCellValue = (sheet: XLSX.WorkSheet, cellRef: string) => {
          const cell = sheet[cellRef];
          if (!cell) return null;
          
          // Handle different types of cell values
          if (cell.t === 'd') { // Date type
            return XLSX.SSF.format('mmm-yy', cell.v);
          }
          return cell.v;
        };

        // Extract months
        const months: string[] = [];
        let rowIndex = 2; // Start from A2

        while (true) {
          const cellRef = `A${rowIndex}`;
          const monthValue = getCellValue(kpiSheet, cellRef);
          if (!monthValue || monthValue === 'Total') break;
          months.push(String(monthValue));
          rowIndex++;
        }

        // Read and transform KPI data
        const transformedKpiData = months.map((month, idx) => {
          const row = idx + 2; // Offset for header row
          return {
            month,
            kpiScore: parseFloat(String(getCellValue(kpiSheet, `B${row}`) || '0').replace('%', '')),
            baseBill: Number(getCellValue(kpiSheet, `C${row}`)) || 0,
            kpiDeductionRate: parseFloat(String(getCellValue(kpiSheet, `D${row}`) || '0').replace('%', '')),
            kpiDeduction: Number(getCellValue(kpiSheet, `E${row}`)) || 0,
            penalty: Number(getCellValue(kpiSheet, `F${row}`)) || 0,
            netInvoice: Number(getCellValue(kpiSheet, `G${row}`)) || 0,
            riskScore: 0,
            delayedWorkOrders: 0,
            costEfficiency: 0,
            qualityScore: 0,
            safetyIndex: 0
          };
        });

        // Read Billing data
        const billingSheet = workbook.Sheets['Billing'];
        const transformedBillingData = months.map((month, idx) => {
          const row = idx + 2; // Offset for header row
          return {
            month,
            status: String(getCellValue(billingSheet, `B${row}`) || 'Not Started'),
            submittedDate: String(getCellValue(billingSheet, `C${row}`) || ''),
            submittedAmount: Number(getCellValue(billingSheet, `D${row}`)) || 0,
            certifiedAmount: getCellValue(billingSheet, `E${row}`) !== null ? Number(getCellValue(billingSheet, `E${row}`)) : null,
            disputedAmount: getCellValue(billingSheet, `F${row}`) !== null ? Number(getCellValue(billingSheet, `F${row}`)) : null,
            received: String(getCellValue(billingSheet, `G${row}`) || ''),
            notes: String(getCellValue(billingSheet, `H${row}`) || ''),
            processingTime: null,
            paymentDelay: null
          };
        });

        setKpiData(transformedKpiData);
        setBillingData(transformedBillingData);
      } catch (error) {
        console.error('Error loading Excel data:', error);
      }
    };

    loadExcelData();
  }, []);

  useEffect(() => {
    setMetrics(calculateMetrics());
  }, [kpiData, billingData]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === metricsContainerRef.current && kpiGaugeRef.current) {
          kpiGaugeRef.current.style.height = `${entry.contentRect.height}px`;
        }
      }
    });

    if (metricsContainerRef.current) {
      resizeObserver.observe(metricsContainerRef.current);
    }

    return () => {
      if (metricsContainerRef.current) {
        resizeObserver.unobserve(metricsContainerRef.current);
      }
    };
  }, []);

  const handleResize = () => {
    const el = wrapperRef.current as HTMLDivElement;
    el.style.width = '100%';
  };

  // Filter function for active months
  const getActiveData = (data: KPIData[]) => {
    return data.filter(item => item.baseBill > 0);
  };

  // const getKpiStatus = (score: number) => {
  //   if (score >= 95) return { text: 'Excellent', class: styles.statusExcellent };
  //   if (score >= 85) return { text: 'Good', class: styles.statusGood };
  //   if (score >= 75) return { text: 'On Track', class: styles.statusOnTrack };
  //   if (score >= 65) return { text: 'At Risk', class: styles.statusAtRisk };
  //   return { text: 'Critical', class: styles.statusCritical };
  // };

  const getLatestKpiData = () => {
    const activeData = kpiData.filter(item => item.baseBill > 0);
    if (activeData.length === 0) return { score: 0, month: 'No Data' };
    const latest = activeData[activeData.length - 1];
    return {
      score: latest.kpiScore * 100,
      month: latest.month
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBackground} />

      <div className={styles.card}>
        <div className={styles.header}>
          
          <div>
            <h1 className={styles.title}>Project KPI & Billing Status</h1>
            <p className={styles.subtitle}>Q1 2025 Analysis</p>
          </div>
          <KpiDonutGauge 
            score={getLatestKpiData().score} 
            month={getLatestKpiData().month}
            //size={220}  // Optional parameter
          />
        </div>
        
        <div className={styles.dataTableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FileText size={18} className={styles.sectionTitleIcon} />
              <span>Monthly Performance Details</span>
            </h2>
            <button 
              className={styles.expandButton}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className={`${styles.dataTableContainer} ${isExpanded ? styles.expanded : ''}`}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeaderCell}>Month</th>
                  <th className={styles.tableHeaderCell}>KPI Score</th>
                  <th className={styles.tableHeaderCell}>Base Bill</th>
                  <th className={styles.tableHeaderCell}>Deduction %</th>
                  <th className={styles.tableHeaderCell}>KPI Deduction</th>
                  <th className={styles.tableHeaderCell}>Penalty</th>
                  <th className={styles.tableHeaderCell}>Net Invoice</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Certified</th>
                  <th className={styles.tableHeaderCell}>Disputed</th>
                  <th className={styles.tableHeaderCell}>Received</th>
                </tr>
              </thead>
              <tbody>
                {getActiveData(kpiData).map((kpiItem, index) => {
                  const billingItem = billingData.find(b => b.month === kpiItem.month) || {} as BillingData;
                  return (
                    <tr key={index} className={index % 2 === 0 ? styles.evenRow : ''}>
                      <td className={styles.tableCell}>{kpiItem.month}</td>
                      <td className={styles.tableCell}>
                        <div className={`${styles.kpiScoreBadge} ${
                          kpiItem.kpiScore*100 >= 95 ? styles.excellent :
                          kpiItem.kpiScore *100 >= 85 ? styles.good :
                          kpiItem.kpiScore *100>= 75 ? styles.average :
                          styles.poor
                        }`}>
                          {kpiItem.kpiScore *100}%
                        </div>
                      </td>
                      <td className={styles.tableCell}>{formatCurrency(kpiItem.baseBill)}</td>
                      <td className={styles.tableCell}>{kpiItem.kpiDeductionRate *100}%</td>
                      <td className={styles.tableCell}>{formatCurrency(kpiItem.kpiDeduction)}</td>
                      <td className={styles.tableCell}>{formatCurrency(kpiItem.penalty)}</td>
                      <td className={styles.tableCell}>{formatCurrency(kpiItem.netInvoice)}</td>
                      <td className={styles.tableCell}>
                        <div className={`${styles.statusBadge} ${
                          (billingItem as BillingData).status === "Submitted" ? styles.statusSubmitted :
                          (billingItem as BillingData).status === "Under Client Review" ? styles.statusReview :
                          styles.statusPreparation
                        }`}>
                          {(billingItem as BillingData).status || "N/A"}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        {billingItem.certifiedAmount ? formatCurrency(billingItem.certifiedAmount) : "-"}
                      </td>
                      <td className={styles.tableCell}>
                        {billingItem.disputedAmount ? formatCurrency(billingItem.disputedAmount) : "-"}
                      </td>
                      <td className={styles.tableCell}>
                        <div className={`${styles.receivedBadge} ${
                          billingItem.received === "Yes" ? styles.received :
                          billingItem.received === "No" ? styles.notReceived :
                          styles.pending
                        }`}>
                          {billingItem.received || "Pending"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td className={styles.tableTotalCell}>Total</td>
                  <td className={styles.tableTotalCell}>{Math.round((metrics?.avgKpiScore ?? 0) * 100)}%</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalBaseBill || 0)}</td>
                  <td className={styles.tableTotalCell}>-</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalDeductions || 0)}</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalPenalties || 0)}</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalSubmitted || 0)}</td>
                  <td className={styles.tableTotalCell}>-</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalCertified || 0)}</td>
                  <td className={styles.tableTotalCell}>{formatCurrency(metrics?.totalDisputed || 0)}</td>
                  <td className={styles.tableTotalCell}>-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiFinanceDashboard;
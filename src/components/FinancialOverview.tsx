import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from "./ui/FinancialOverview.module.css";

interface FinancialData {
  month: string;
  budgetedCost: number;
  actualCost: number;
  costVariance: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  variations: number;
  variationImpact: number;
}

interface FinancialTotals {
  revenue: number;
  profit: number;
  costVariance: number;
  variations: number;
  variationImpact: number;
}

const FinancialOverview: React.FC = () => {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [contractValue, setContractValue] = useState<number>(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const variationIndicatorRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const loadFinancialData = async () => {
    try {
    const response = await fetch('Project Performance Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
        cellStyles: true,
        cellDates: true,
        cellNF: true,
    });

    // Get Project Overview sheet for contract value
    const overviewSheet = workbook.Sheets['Project Overview'];
    const contractValue = overviewSheet['D7']?.v || 0; // Get value from cell D7
    setContractValue(contractValue); // Add this line to set the value

    // Get Financial sheet data (your existing code)
    const sheet = workbook.Sheets['Financial'];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const processedData: FinancialData[] = Array.from({ length: 12 }, (_, index) => {
        // Find matching data from raw data or use default values
        const rawRow = rawData[index + 2] || [];
        const date = new Date(2025, index, 1);
        
        return {
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            budgetedCost: Number(rawRow[1]) || 0,
            actualCost: Number(rawRow[2]) || 0,
            costVariance: Number(rawRow[3]) || 0,
            revenue: Number(rawRow[4]) || 0,
            profit: Number(rawRow[5]) || 0,
            profitMargin: (Number(rawRow[6]) || 0) * 100,
            variations: Number(rawRow[7]) || 0,
            variationImpact: Number(rawRow[8]) || 0
        };
        });

    setData(processedData);
    setLoading(false);
    } catch (err) {
    console.error('Error loading data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load data');
    setLoading(false);
    }
};

loadFinancialData();
}, []);

    // New useEffect to set initial selected month
    useEffect(() => {
        if (data.length > 0) {
            setSelectedMonth(data[0].month);
        }
        }, [data]);

    useEffect(() => {
        const updateHeight = () => {
            if (tableContainerRef.current && variationIndicatorRef.current) {
            variationIndicatorRef.current.style.height = `${tableContainerRef.current.offsetHeight}px`;
            }
        };
        
        // Observe height changes in table container
        const observer = new ResizeObserver(() => updateHeight());
        if (tableContainerRef.current) {
            observer.observe(tableContainerRef.current);
        }
        
        // Initial height adjustment
        updateHeight();
        
        return () => observer.disconnect();
        }, []);

  const formatCurrency = (value: number): string => 
    `QAR ${value.toLocaleString()}`;

  const formatPercentage = (value: number): string => 
    `${value.toFixed(1)}%`;

  const totals: FinancialTotals = data.reduce((acc: FinancialTotals, curr: FinancialData) => ({
    revenue: acc.revenue + curr.revenue,
    profit: acc.profit + curr.profit,
    costVariance: acc.costVariance + curr.costVariance,
    variations: acc.variations + curr.variations,
    variationImpact: acc.variationImpact + curr.variationImpact
  }), {
    revenue: 0,
    profit: 0,
    costVariance: 0,
    variations: 0,
    variationImpact: 0
  });

  const avgProfitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
        <div className={styles.headerBackground} />
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Financial Performance Dashboard</h1>
                <p className={styles.subtitle}>Q1 2025 Analysis</p>
            </div>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                <h3 className={styles.kpiLabel}>Total Revenue</h3>
                <p className={styles.kpiValue}>{formatCurrency(totals.revenue)}</p>
                <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
                    <ArrowUpRight className={styles.trendIcon} />
                    <span>6.7% increase</span>
                </div>
                </div>

                <div className={styles.kpiCard}>
                <h3 className={styles.kpiLabel}>Net Profit</h3>
                <p className={styles.kpiValue}>{formatCurrency(totals.profit)}</p>
                <div className={`${styles.kpiTrend} ${totals.profit >= 0 ? styles.trendPositive : styles.trendNegative}`}>
                    <ArrowUpRight className={styles.trendIcon} />
                    <span>{formatPercentage(avgProfitMargin)}</span>
                </div>
                </div>

                <div className={styles.kpiCard}>
                <h3 className={styles.kpiLabel}>Cost Variance</h3>
                <p className={styles.kpiValue}>{formatCurrency(totals.costVariance)}</p>
                <div className={styles.kpiTrend}>
                    <span>{formatPercentage((totals.costVariance / totals.revenue) * 100)}</span>
                </div>
                </div>

                <div className={styles.kpiCard}>
                <h3 className={styles.kpiLabel}>Variations</h3>
                <p className={styles.kpiValue}>{totals.variations}</p>
                <div className={styles.kpiTrend}>
                    <span>{formatCurrency(totals.variationImpact)}</span>
                </div>
                </div>
            </div>

            {/* Chart */}
            <div className={styles.chartContainer}>
                <h2 className={styles.chartTitle}>Profit & Loss Analysis</h2>
                <div className={styles.chartWithDetails}>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" />
                            <YAxis 
                                yAxisId="left" 
                                tickFormatter={formatCurrency}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                tickFormatter={formatPercentage}
                            />
                            <Tooltip 
                                formatter={(value: number, name: string) => {
                                if (name === "Profit Margin") return [formatPercentage(value), name];
                                return [formatCurrency(value), name];
                                }}
                                contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            />
                            <Legend />
                            {/* Fix: Add yAxisId to ReferenceLine */}
                            <ReferenceLine y={0} stroke="#94a3b8" yAxisId="left" />
                            
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                fill="#FFB7B2"  // Soft coral pink
                                stroke="#FF6B6B"  // Bright coral
                                fillOpacity={0.4}
                            />

                            <Bar
                                yAxisId="left"
                                dataKey="actualCost"
                                name="Actual Cost"
                                fill="#4ECDC4"  // Turquoise
                                fillOpacity={0.7}
                                radius={[4, 4, 0, 0]}
                            />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="profit"
                                name="Profit"
                                stroke="#FFD93D"  // Sunny yellow
                                strokeWidth={2}
                                dot={{ fill: '#FFD93D', r: 6 }}
                            />

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="profitMargin"
                                name="Profit Margin"
                                stroke="#FF9F1C"  // Bright orange
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#FF9F1C', r: 4 }}
                            />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>


                    <div className={styles.monthlyDetailsWrapper}>
                        <div className={styles.monthSelector}>
                            <label htmlFor="monthSelector" className={styles.selectLabel}>Select Month:</label>
                            <select 
                                id="monthSelector"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className={styles.select}
                            >
                                {data.map((item, index) => (
                                    <option key={index} value={item.month}>
                                        {item.month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {data.filter(item => item.month === selectedMonth).map((item, index) => (
                            <div key={index} className={styles.detailsGrid}>
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailLabel}>Revenue</h3>
                                    <p className={styles.detailValue}>{formatCurrency(item.revenue)}</p>
                                </div>
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailLabel}>Actual Cost</h3>
                                    <p className={styles.detailValue}>{formatCurrency(item.actualCost)}</p>
                                </div>
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailLabel}>Profit</h3>
                                    <p className={styles.detailValue}>{formatCurrency(item.profit)}</p>
                                </div>
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailLabel}>Profit Margin %</h3>
                                    <p className={styles.detailValue}>{formatPercentage(item.profitMargin)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Variations Table */}
            <div className={styles.tableAndIndicatorContainer}>
                <div className={styles.tablePart}>
                    <div className={styles.tableContainer} ref={tableContainerRef}>
                        <div className={styles.tableHeader}>
                        <h2 className={styles.tableTitle}>Contract Variations</h2>
                        </div>
                        <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th className={styles.tableHeaderCell}>Month</th>
                                <th className={styles.tableHeaderCell}>Variations</th>
                                <th className={styles.tableHeaderCell}>Impact</th>
                                <th className={styles.tableHeaderCell}>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data
                                .filter(item => item.variations > 0 || item.variationImpact > 0) // Filter non-null data
                                .map((item, index) => (
                                <tr key={index}>
                                <td className={styles.tableCell}>{item.month}</td>
                                <td className={styles.tableCell}>
                                    <span className={styles.variationCount}>
                                    {item.variations} variations
                                    </span>
                                </td>
                                <td className={styles.tableCell}>
                                    {formatCurrency(item.variationImpact)}
                                </td>
                                <td className={styles.tableCell}>
                                    <span className={`${styles.badge} ${item.variationImpact > 5000 ? styles.badgeHigh : styles.badgeNormal}`}>
                                    {item.variationImpact > 5000 ? 'High Impact' : 'Normal'}
                                    </span>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                        
                                <tr className={styles.totalRow}>
                                    <td className={styles.tableCell}>Total</td>
                                    <td className={styles.tableCell}>
                                    <span className={styles.variationCount}>{totals.variations} variations</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                    {formatCurrency(totals.variationImpact)}
                                    </td>
                                    <td className={styles.tableCell} />
                                </tr>
                            
                            </tfoot>
                        </table>
                        </div>
                    </div>
                </div>

                <div className={styles.variationIndicator} ref={variationIndicatorRef}>
                    <h3 className={styles.indicatorTitle}>Variation Impact on Contract Value</h3>
                    <div className={styles.indicatorContent}>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadialBarChart 
                                innerRadius="60%"
                                outerRadius="100%"
                                data={[{
                                    name: 'Variation Impact',
                                    value: (totals.variationImpact / contractValue) * 100,
                                    fill: '#4ECDC4'
                                }]}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={styles.percentageText}
                                >
                                    {`${((totals.variationImpact / contractValue) * 100).toFixed(1)}%`}
                                </text>
                                <text
                                    x="50%"
                                    y="65%"
                                    textAnchor="middle"
                                    className={styles.impactLabel}
                                >
                                    Impact
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* <div className={styles.impactDetails}>
                            <div className={styles.impactItem}>
                                <span className={styles.impactLabel}>Total Contract Value:</span>
                                <span className={styles.impactValue}>{formatCurrency(contractValue)}</span>
                            </div>
                            <div className={styles.impactItem}>
                                <span className={styles.impactLabel}>Total Variations:</span>
                                <span className={styles.impactValue}>{formatCurrency(totals.variationImpact)}</span>
                            </div>
                        </div> */}
                    </div>
                </div>              

            </div>  
              
        </div>
    </div>
  );
};

export default FinancialOverview;
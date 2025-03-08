import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, Line
} from 'recharts';
import { 
  CalendarClock, CheckCircle, AlertTriangle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  ClipboardList, Wrench 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './ui/PPMandWOs.module.css';

// Brand colors as JS variables for chart config only
const CHART_COLORS = {
  qdPurple: '#D4745C',  // Terracotta/coral color
  chartBlue: '#7A9E7E',  // Sage green
  chartGreen: '#4ECDC4',
  chartAmber: '#FF9F1C',
  slate: '#408AB4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

// TypeScript interfaces
interface PPMDataItem {
  month: string;
  planned: number;
  completed: number;
  completion: number;
  carryOver: number;
  status: string;
  notes?: string;
}

interface WODataItem {
  month: string;
  raised: number;
  completed: number;
  completion: number;
  backlog: number;
}

interface ChartDataItem {
  name: string;
  Planned?: number;
  Completed: number;
  Raised?: number;
  Completion: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className={styles.tooltipItem} data-color={entry.color}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ExecutiveDashboard: React.FC = () => {
  const [ppmData, setPpmData] = useState<PPMDataItem[]>([]);
  const [woData, setWoData] = useState<WODataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ppm' | 'wo'>('ppm');
  const [currentMonthPPM, setCurrentMonthPPM] = useState<PPMDataItem | null>(null);
  const [currentMonthWO, setCurrentMonthWO] = useState<WODataItem | null>(null);
  const [ppmCompletionTrend, setPpmCompletionTrend] = useState<number>(0);
  const [woCompletionTrend, setWoCompletionTrend] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('Project Performance Template.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellStyles: true,
          cellDates: true,
          cellNF: true,
        });

        // Read PPM data
        const ppmSheet = workbook.Sheets['PPM'];
        const ppmRange = XLSX.utils.decode_range(ppmSheet['!ref'] || 'A1');
        let lastRow = ppmRange.e.r;

        // Find the last non-empty row in Month column (A)
        for (let row = ppmRange.e.r; row >= 3; row--) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
          if (ppmSheet[cellRef]) {
            lastRow = row;
            break;
          }
        }

        // Extract PPM data from row 3 to lastRow
        const ppmFormattedData: PPMDataItem[] = [];
        let lastValidPPMMonth: PPMDataItem | null = null;

        for (let row = 2; row <= lastRow; row++) {
          const monthCell = ppmSheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v;
          
          // Only skip empty months
          if (!monthCell) continue;

          const month = monthCell instanceof Date 
            ? monthCell.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            : String(monthCell);
          
          const planned = Number(ppmSheet[XLSX.utils.encode_cell({ r: row, c: 1 })]?.v || 0);
          const completed = Number(ppmSheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v || 0);
          const completion = planned > 0 ? Number(((completed / planned) * 100).toFixed(1)) : 0;
          const carryOver = Number(ppmSheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v || 0);
          const target = completion >= 95 ? 'Above Target' : 'Below Target';
          const notes = ppmSheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v;

          const ppmItem = {
            month,
            planned,
            completed,
            completion,
            carryOver,
            status: target,
            notes
          };

          ppmFormattedData.push(ppmItem);
          // Update last valid month only if it has planned tasks
          if (planned > 0) lastValidPPMMonth = ppmItem;
        }

        // Read WO data
        const woSheet = workbook.Sheets['WOs'];
        const woRange = XLSX.utils.decode_range(woSheet['!ref'] || 'A1');
        
        // Find last non-empty row in Month column (A), excluding "Total" row
        let woLastRow = woRange.e.r;
        for (let row = woRange.e.r; row >= 3; row--) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
          const value = woSheet[cellRef]?.v;
          if (value && value.toString().toLowerCase() !== 'total') {
            woLastRow = row;
            break;
          }
        }

        // Extract WO data from row 3 to woLastRow
        const woFormattedData: WODataItem[] = [];
        let lastValidWOMonth: WODataItem | null = null;

        for (let row = 2; row <= woLastRow; row++) {
          const monthCell = woSheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v;
          
          // Only skip empty months
          if (!monthCell) continue;

          const month = monthCell instanceof Date 
            ? monthCell.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            : String(monthCell);
          
          const raised = Number(woSheet[XLSX.utils.encode_cell({ r: row, c: 1 })]?.v || 0);
          const completed = Number(woSheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v || 0);
          const completion = raised > 0 ? Number(((completed / raised) * 100).toFixed(1)) : 0;
          const backlog = Number(woSheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v || 0);

          const woItem = {
            month,
            raised,
            completed,
            completion,
            backlog
          };

          woFormattedData.push(woItem);
          // Update last valid month only if it has raised WOs
          if (raised > 0) lastValidWOMonth = woItem;
        }

        setPpmData(ppmFormattedData);
        setWoData(woFormattedData);
        // Set the last valid months for KPI Cards
        setCurrentMonthPPM(lastValidPPMMonth);
        setCurrentMonthWO(lastValidWOMonth);

        // Calculate trends using valid data
        if (ppmFormattedData.length >= 2) {
          const validMonths = ppmFormattedData.filter(item => item.planned > 0);
          if (validMonths.length >= 2) {
            const current = validMonths[validMonths.length - 1].completion;
            const previous = validMonths[validMonths.length - 2].completion;
            setPpmCompletionTrend(current - previous);
          }
        }

        if (woFormattedData.length >= 2) {
          const validMonths = woFormattedData.filter(item => item.raised > 0);
          if (validMonths.length >= 2) {
            const current = validMonths[validMonths.length - 1].completion;
            const previous = validMonths[validMonths.length - 2].completion;
            setWoCompletionTrend(current - previous);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format PPM data for the chart - show all months including zeros
  const ppmChartData: ChartDataItem[] = ppmData
    .filter(item => typeof item.month === 'string' && item.month.toLowerCase() !== 'total')
    .map(item => ({
      name: item.month,
      Planned: Number(item.planned) || 0,
      Completed: Number(item.completed) || 0,
      Completion: Number(item.completion) || 0
    }));

  // Format WO data for the chart - show all months including zeros
  const woChartData: ChartDataItem[] = woData
    .filter(item => typeof item.month === 'string' && item.month.toLowerCase() !== 'total')
    .map(item => ({
      name: item.month,
      Raised: Number(item.raised) || 0,
      Completed: Number(item.completed) || 0,
      Completion: Number(item.completion) || 0
    }));

  // KPI Status for CSS classes
  const getPPMStatusClass = (completion: number | undefined): string => {
    if (!completion) return 'warning';
    if (completion >= 98) return 'success';
    if (completion >= 90) return 'warning';
    return 'danger';
  };

  const getWOStatusClass = (completion: number | undefined): string => {
    if (!completion) return 'warning';
    if (completion >= 95) return 'success';
    if (completion >= 85) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header Section */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Maintenance Performance</h2>
            <p className={styles.subtitle}>
              PPM & Work Order Executive Dashboard
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className={styles.tabContainer}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'ppm' ? styles.active : ''}`}
              onClick={() => setActiveTab('ppm')}
            >
              <CalendarClock strokeWidth={1.5} className={styles.tabIcon} />
              PPM
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'wo' ? styles.active : ''}`}
              onClick={() => setActiveTab('wo')}
            >
              <Wrench strokeWidth={1.5} className={styles.tabIcon} />
              Work Orders
            </button>
          </div>
        </div>

        {/* Chart Section */}
        
        <div className={styles.chartKPIContainer}>
          <div className={styles.chartSection}>
            <h3 className={styles.chartTitle}>
              {activeTab === 'ppm' ? 'PPM Performance Trend' : 'Work Order Performance Trend'}
            </h3>
                    
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'ppm' ? (
                  <ComposedChart data={ppmChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" scale="band" />
                    <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.slate} />
                    <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.chartGreen} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar yAxisId="left" dataKey="Planned" fill={CHART_COLORS.qdPurple} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="left" dataKey="Completed" fill={CHART_COLORS.chartBlue} radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="Completion" stroke={CHART_COLORS.chartGreen} strokeWidth={2} 
                          dot={{ stroke: CHART_COLORS.chartGreen, strokeWidth: 2, r: 4, fill: 'white' }} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={woChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" scale="band" />
                    <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.slate} />
                    <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.chartGreen} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar yAxisId="left" dataKey="Raised" fill={CHART_COLORS.chartAmber} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="left" dataKey="Completed" fill={CHART_COLORS.chartBlue} radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="Completion" stroke={CHART_COLORS.chartGreen} strokeWidth={2} 
                          dot={{ stroke: CHART_COLORS.chartGreen, strokeWidth: 2, r: 4, fill: 'white' }} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            {activeTab === 'ppm' ? (
              <>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Planned Tasks</p>
                    <CalendarClock strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValueContainer}>  
                    <p className={styles.kpiValue}>{currentMonthPPM?.planned.toLocaleString()}</p>
                    <p className={styles.kpiContext}>
                      {currentMonthPPM?.month} Target
                    </p>
                  </div>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Completed Tasks</p>
                    <CheckCircle strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValueContainer}> 
                    <p className={styles.kpiValue}>{currentMonthPPM?.completed.toLocaleString()}</p>
                    <p className={`${styles.kpiContext} ${currentMonthPPM?.status === 'Above Target' ? styles.success : styles.danger}`}>
                      {currentMonthPPM?.status === 'Above Target' ? (
                        <ArrowUpRight size={16} className={styles.trendIcon} />
                      ) : (
                        <ArrowDownRight size={16} className={styles.trendIcon} />
                      )}
                      {currentMonthPPM?.status}
                    </p>
                  </div>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Completion Rate</p>
                    <TrendingUp size={20} className={styles.kpiIcon} /> {/* Fixed size prop */}
                  </div>
                  <div className={styles.kpiValueContainer}> 
                    <p className={`${styles.kpiValue} ${styles[getPPMStatusClass(currentMonthPPM?.completion)]}`}>
                      {currentMonthPPM?.completion}%
                    </p>
                    <p className={`${styles.kpiContext} ${ppmCompletionTrend >= 0 ? styles.success : styles.danger}`}>
                      {ppmCompletionTrend >= 0 ? (
                        <ArrowUpRight className={styles.trendIcon} />
                      ) : (
                        <ArrowDownRight className={styles.trendIcon} />
                      )}
                      {Math.abs(ppmCompletionTrend).toFixed(1)}% vs Last Month
                    </p>
                  </div>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Carry-Over Tasks</p>
                    <AlertTriangle strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValueContainer}> 
                    <p className={`${styles.kpiValue} ${styles.warning}`}>{currentMonthPPM?.carryOver}</p>
                    <p className={styles.kpiContext}>
                      {currentMonthPPM && ((currentMonthPPM.carryOver / currentMonthPPM.planned * 100).toFixed(1))}% of planned
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>WOs Raised</p>
                    <ClipboardList strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <p className={styles.kpiValue}>{currentMonthWO?.raised}</p>
                  <p className={styles.kpiContext}>
                    Total in {currentMonthWO?.month}
                  </p>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>WOs Completed</p>
                    <CheckCircle strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <p className={styles.kpiValue}>{currentMonthWO?.completed}</p>
                  <p className={styles.kpiContext}>
                    {currentMonthWO && ((currentMonthWO.completed / currentMonthWO.raised * 100).toFixed(0))}% of raised
                  </p>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Completion Rate</p>
                    <TrendingUp size={20} className={styles.kpiIcon} /> {/* Fixed size prop */}
                  </div>
                  <p className={`${styles.kpiValue} ${styles[getWOStatusClass(currentMonthWO?.completion)]}`}>
                    {currentMonthWO?.completion}%
                  </p>
                  <p className={`${styles.kpiContext} ${woCompletionTrend >= 0 ? styles.success : styles.danger}`}>
                    {woCompletionTrend >= 0 ? (
                      <ArrowUpRight className={styles.trendIcon} />
                    ) : (
                      <ArrowDownRight className={styles.trendIcon} />
                    )}
                    {Math.abs(woCompletionTrend).toFixed(1)}% vs Last Month
                  </p>
                </div>
                
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <p className={styles.kpiLabel}>Backlog</p>
                    <AlertTriangle strokeWidth={1.5} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValueContainer}>
                    <p className={`${styles.kpiValue} ${styles.warning}`}>{currentMonthWO?.backlog}</p>
                    <p className={styles.kpiContext}>
                      {currentMonthWO && ((currentMonthWO.backlog / currentMonthWO.raised * 100).toFixed(1))}% of raised
                    </p>
                  </div>
                </div>
              </>
            )}
          </div> 

        </div>

        {/* Status Summary */}
        <div className={`${styles.statusSummary} ${
          activeTab === 'ppm'
            ? currentMonthPPM?.status === 'Above Target' 
              ? styles.success 
              : styles.warning
            : currentMonthWO && currentMonthWO.completion >= 90 
              ? styles.success 
              : styles.warning
        }`}>
          <div className={styles.statusIconContainer}>
            {activeTab === 'ppm' ? (
              currentMonthPPM?.status === 'Above Target' ? (
                <CheckCircle strokeWidth={1.5} className={`${styles.statusIcon} ${styles.iconSuccess}`} />
              ) : (
                <AlertTriangle strokeWidth={1.5} className={`${styles.statusIcon} ${styles.iconWarning}`} />
              )
            ) : (
              currentMonthWO && currentMonthWO.completion >= 90 ? (
                <CheckCircle strokeWidth={1.5} className={`${styles.statusIcon} ${styles.iconSuccess}`} />
              ) : (
                <AlertTriangle strokeWidth={1.5} className={`${styles.statusIcon} ${styles.iconWarning}`} />
              )
            )}
          </div>
          <div>
            <h4 className={styles.statusTitle}>
              {activeTab === 'ppm' 
                ? `PPM Performance: ${currentMonthPPM?.status}` 
                : `WO Performance: ${currentMonthWO && currentMonthWO.completion >= 90 ? 'Good' : 'Needs Attention'}`}
            </h4>
            <p className={styles.statusText}>
              {activeTab === 'ppm' && currentMonthPPM
                ? `${currentMonthPPM.completed} of ${currentMonthPPM.planned} tasks completed (${currentMonthPPM.completion}%)` 
                : currentMonthWO ? `${currentMonthWO.completed} of ${currentMonthWO.raised} work orders completed (${currentMonthWO.completion}%)` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
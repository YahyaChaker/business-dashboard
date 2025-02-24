import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Users, LucideUsers , TrendingUpDown} from 'lucide-react';
import styles from './ui/ManpowerAnalysis.module.css';

// Define types
interface ManpowerNode {
  srNo: number;
  role: string;
  reportsTo: string | null;
  level: number;
  boq: number;
  actual: number;
  actuals: number[];  // Add this to store all monthly values
  variance: number;
}

interface TrendData {
  date: string;
  boq: number;
  actual: number;
}

interface OrganizationChartProps {
    data: ManpowerNode[];
  }


interface StaffingStatus {
    role: string;
    variance: number;
  }

declare global {
  interface Window {
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array>;
    };
  }
}


interface OrgNodeProps {
  node: ManpowerNode;
}

const OrgNode: React.FC<OrgNodeProps> = ({ node }) => {
    return (
      <div className={`${styles.node} ${styles[`nodeBorderLevel${node.level}`]}`}>
        <h4 className={styles.nodeTitle}>
          {node.role}
        </h4>
        <div className={`${styles.statsContainer} ${styles[`statsLevel${node.level}`]}`}>
          <div className={styles.statColumn}>
            <p className={styles.statLabel}>BOQ</p>
            <p className={styles.statValue}>{node.boq}</p>
          </div>
          <div className={styles.statColumn}>
            <p className={styles.statLabel}>Act</p>
            <p className={styles.statValue}>{node.actual}</p>
          </div>
        </div>
        {node.variance !== 0 && (
          <div className={`${styles.variance} ${node.variance > 0 ? styles.variancePositive : styles.varianceNegative}`}>
            {node.variance > 0 ? '+' : ''}{node.variance}
          </div>
        )}
      </div>
    );
  };



const OrganizationChart: React.FC<OrganizationChartProps> = ({ data }) => {
  const nodesByLevel = data.reduce<Record<number, ManpowerNode[]>>((acc, node) => {
    const level = node.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(node);
    return acc;
  }, {});

  const sortedLevels = Object.keys(nodesByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={styles.orgChart}>
      {sortedLevels.map((level) => (
        <div key={level} className={styles.levelContainer}>
          <div className={`${styles.levelLabel} ${styles[`levelLabel${level}`]}`}>
            Level {level}
          </div>
          <div className={styles.nodesContainer}>
            {nodesByLevel[level].map((node, nodeIndex) => (
              <OrgNode key={nodeIndex} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ManpowerAnalysis: React.FC = () => {
    const monthsStartIndex = 5; // First month (Jan-25) starts at column F
    const [orgData, setOrgData] = useState<ManpowerNode[]>([]);
    const [trendsData, setTrendsData] = useState<TrendData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [missingManpower, setMissingManpower] = useState<StaffingStatus[]>([]);
    const [extraManpower, setExtraManpower] = useState<StaffingStatus[]>([]);
    const [monthLabels, setMonthLabels] = useState<Date[]>([]);
    const [rawData, setRawData] = useState<any[][]>([]);
    const [isChecked, setIsChecked] = useState<boolean>(false); // Track checkbox state

    // Add the function here, before useEffect
    const updateOrgDataForMonth = (monthIndex: number) => {
        setOrgData(prevData => 
            prevData.map(node => ({
                ...node,
                actual: node.actuals[monthIndex] || 0,
                variance: (node.actuals[monthIndex] || 0) - node.boq
            }))
        );
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(e.target.value);
    };

  useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('Project Performance Template.xlsx');
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, {
                    cellStyles: true,
                    cellDates: true,
                    cellNF: true,
                });

                const sheet = workbook.Sheets['Manpower'];
                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                
                const monthLabels = rawData[1].slice(monthsStartIndex); // Extract month names
                setMonthLabels(monthLabels);
                setRawData(rawData);

                // Process hierarchy data (excluding total row)
                const hierarchyData = rawData.slice(2) // Start from row 3 (actual data)
                    .filter(row => row[1] && row[1] !== 'Total') // Ensure valid role names
                    .map(row => {
                        const actualData = row.slice(monthsStartIndex).map(value => Number(value) || 0); // Convert to numbers

                        return {
                            srNo: Number(row[0]) || 0,     // Column A: Serial Number
                            role: String(row[1]),          // Column B: Trade/Role
                            reportsTo: row[2] || null,     // Column C: Reporting To
                            level: Number(row[3]) || 0,    // Column D: Levels
                            boq: Number(row[4]) || 0,      // Column E: BOQ
                            actuals: actualData,  // Store all monthly values
                            actual: actualData[0] || 0,    // First month's actual value
                            variance: (actualData[0] || 0) - (Number(row[4]) || 0) // Variance for first month
                        };
                    });

                setOrgData(hierarchyData);

                // Process trends data (Total row)
                const totalRow = rawData.find(row => row[1] === 'Total');
                if (totalRow) {
                    const totalActuals = totalRow.slice(monthsStartIndex).map(value => Number(value) || 0);

                    const monthlyData = monthLabels.map((month, index) => ({
                        date: new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                        boq: Number(totalRow[4]) || 0, // BOQ from "Total" row
                        actual: totalActuals[index] || 0,
                        variance: (totalActuals[index] || 0) - (Number(totalRow[4]) || 0)
                    }));

                    setTrendsData(monthlyData);
                }

                // After setTrendsData(monthlyData);
                if (monthLabels.length > 0) {
                    // Set latest month as default
                    const latestMonth = new Date(monthLabels[monthLabels.length - 1]);
                    setSelectedMonth(latestMonth);

                    // Update org data for the latest month
                    updateOrgDataForMonth(monthLabels.length - 1);
                    
                    // Process staffing status for the latest month
                    const monthIndex = monthLabels.length - 1;
                    const staffingData = rawData.slice(2)
                        .filter(row => row[1] && row[1] !== 'Total')
                        .map(row => ({
                            role: String(row[1]),
                            variance: (Number(row[monthsStartIndex + monthIndex]) || 0) - (Number(row[4]) || 0)
                        }));
                    
                    setMissingManpower(staffingData.filter(staff => staff.variance < 0));
                    setExtraManpower(staffingData.filter(staff => staff.variance > 0));
                }

            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
        
    }, []);

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(event.target.value);
        setSelectedMonth(newDate);
        
        const monthIndex = monthLabels.findIndex(
            date => new Date(date).getTime() === newDate.getTime()
        );
        
        if (monthIndex !== -1) {
            // Update staffing data
            const staffingData = rawData.slice(2)
                .filter(row => row[1] && row[1] !== 'Total')
                .map(row => ({
                    role: String(row[1]),
                    variance: (Number(row[monthsStartIndex + monthIndex]) || 0) - (Number(row[4]) || 0)
                }));
            
            setMissingManpower(staffingData.filter(staff => staff.variance < 0));
            setExtraManpower(staffingData.filter(staff => staff.variance > 0));
    
            // Update org data for selected month
            setOrgData(prevData => 
                prevData.map(node => ({
                    ...node,
                    actual: node.actuals[monthIndex] || 0,
                    variance: (node.actuals[monthIndex] || 0) - node.boq
                }))
            );
        }
    };

  return (
    <Card className={styles.container}>
      <CardContent className={styles.cardContent}>
        <div className={styles.header}>
            <div className={styles.titleContainer}>
                <Users className={styles.headerIcon} />
                <h3 className={styles.title}>
                    Manpower Analysis
                </h3>
            </div> 
        </div>

        <div className={styles.trendsSection}>
    <div className={styles.trendsFlex}>
        {/* Left side - Chart */}
        <div className={styles.chartSide}>
            <div className={styles.titleContainer}>
                <TrendingUpDown className={styles.headerIcon} />
                <h4 className={styles.trendsTitle}>
                    Manpower Trend
                </h4>
            </div>
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData} className={styles.chart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                            wrapperClassName={styles.tooltip}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="boq" 
                            stroke="var(--summer-sky)"
                            name="BOQ Required"
                            strokeWidth={2}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="var(--summer-coral)"
                            name="Actual Deployment"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Right side - Staffing Analysis */}
        <div className={styles.staffingSide}>
            {/* Month Selector */}
            <div className={styles.monthSelectorContainer}>
                <label htmlFor="monthSelect" className={styles.selectLabel}>
                    Select Month:
                </label>
                <select 
                    id="monthSelect"
                    className={styles.monthSelector}
                    value={selectedMonth?.toISOString() || ''}
                    onChange={handleMonthChange}
                    aria-label="Select Month"
                >
                    {monthLabels.length > 0 ? (
                        trendsData.map((data, index) => (
                            <option 
                                key={index} 
                                value={new Date(monthLabels[index]).toISOString()}
                            >
                                {data.date}
                            </option>
                        ))
                    ) : (
                        <option value="">No data available</option>
                    )}
                </select>
            </div>
            
            {/* Staffing Containers */}
            <div className={styles.staffingContainers}>
                {/* Missing Manpower Container */}
                <div className={styles.staffingContainer}>
                    <h4 className={styles.staffingTitle}>Missing Manpower</h4>
                    <div className={styles.staffingList}>
                        {missingManpower.map((staff, index) => (
                            <div key={index} className={styles.staffingItem}>
                                <span className={styles.staffingRole}>
                                    {staff.role}
                                </span>
                                <span 
                                    className={styles.staffingVariance} 
                                    style={{ color: 'var(--summer-coral)' }}
                                >
                                    {staff.variance}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extra Manpower Container */}
                <div className={styles.staffingContainer}>
                    <h4 className={styles.staffingTitle}>Extra Manpower</h4>
                    <div className={styles.staffingList}>
                        {extraManpower.map((staff, index) => (
                            <div key={index} className={styles.staffingItem}>
                                <span className={styles.staffingRole}>
                                    {staff.role}
                                </span>
                                <span 
                                    className={styles.staffingVariance} 
                                    style={{ color: 'var(--summer-leaf)' }}
                                >
                                    +{staff.variance}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

      {/* Manpower Organization section */}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <LucideUsers className={styles.headerIcon} />
          <h3 className={styles.title}>Manpower Organization</h3>
        </div>
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="showExtra"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
          />
          <label htmlFor="showExtra">Expand Manpower</label>
        </div>
      </div>

      {isChecked && <OrganizationChart data={orgData} />}

      </CardContent>
    </Card>
  );
};

export default ManpowerAnalysis;
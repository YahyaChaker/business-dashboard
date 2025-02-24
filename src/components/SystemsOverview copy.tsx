import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building2, Users2, Clock } from 'lucide-react';
import styles from './ui/SystemsOverview.module.css';

const SystemsOverview = () => {
  // Data analysis
  const systemsData = {
    total: 15,
    inHouse: 7,
    subcontracted: 8,
    activeSubcontractors: 6,
    onHold: 1,
    notStarted: 2,
    totalContractValue: 20300000
  };

  // Calculate percentages
  const inHousePercentage = (systemsData.inHouse / systemsData.total) * 100;
  const subcontractedPercentage = (systemsData.subcontracted / systemsData.total) * 100;

  // Pie chart data
  const ownershipData = [
    { name: 'In-House', value: systemsData.inHouse, color: '#4ECDC4' },
    { name: 'Subcontracted', value: systemsData.subcontracted, color: '#FF9F1C' }
  ];

  const statusData = [
    { name: 'Active', value: systemsData.activeSubcontractors, color: '#2AB7CA' },
    { name: 'On Hold', value: systemsData.onHold, color: '#FFD93D' },
    { name: 'Not Started', value: systemsData.notStarted, color: '#FF6B6B' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
            <h2 className={styles.title}>Systems Overview</h2>
            <p className={styles.subtitle}>Project Scope of Work Analysis</p>
        </div>
        {/* Top Stats Row
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.cyan}`}>
            <div className={styles.statHeader}>
              <Building2 className={`${styles.statIcon} ${styles.cyan}`} size={20} />
              <h3 className={styles.statTitle}>Total Systems</h3>
            </div>
            <p className={`${styles.statValue} ${styles.cyan}`}>{systemsData.total}</p>
          </div>
          
          <div className={`${styles.statCard} ${styles.orange}`}>
            <div className={styles.statHeader}>
              <Users2 className={`${styles.statIcon} ${styles.orange}`} size={20} />
              <h3 className={styles.statTitle}>Contract Value</h3>
            </div>
            <p className={`${styles.statValue} ${styles.orange}`}>
              {(systemsData.totalContractValue / 1000000).toFixed(1)}M
            </p>
          </div>
          
          <div className={`${styles.statCard} ${styles.green}`}>
            <div className={styles.statHeader}>
              <Clock className={`${styles.statIcon} ${styles.green}`} size={20} />
              <h3 className={styles.statTitle}>Active Systems</h3>
            </div>
            <p className={`${styles.statValue} ${styles.green}`}>
              {systemsData.activeSubcontractors + systemsData.inHouse}
            </p>
          </div>
        </div> */}

        {/* Charts Row */}
        <div className={styles.chartsGrid}>
          {/* Stats Column */}
          <div className={styles.chartCard}>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.cyan}`}>
                <div className={styles.statHeader}>
                  <Building2 className={`${styles.statIcon} ${styles.cyan}`} size={20} />
                  <h3 className={styles.statTitle}>Total Systems</h3>
                </div>
                <p className={`${styles.statValue} ${styles.cyan}`}>{systemsData.total}</p>
              </div>
              
              <div className={`${styles.statCard} ${styles.orange}`}>
                <div className={styles.statHeader}>
                  <Users2 className={`${styles.statIcon} ${styles.orange}`} size={20} />
                  <h3 className={styles.statTitle}>Contract Value</h3>
                </div>
                <p className={`${styles.statValue} ${styles.orange}`}>
                  {(systemsData.totalContractValue / 1000000).toFixed(1)}M
                </p>
              </div>
              
              <div className={`${styles.statCard} ${styles.green}`}>
                <div className={styles.statHeader}>
                  <Clock className={`${styles.statIcon} ${styles.green}`} size={20} />
                  <h3 className={styles.statTitle}>Active Systems</h3>
                </div>
                <p className={`${styles.statValue} ${styles.green}`}>
                  {systemsData.activeSubcontractors + systemsData.inHouse}
                </p>
              </div>
            </div>
          </div>

          {/* Ownership Distribution */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Ownership Distribution</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ownershipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => 
                      `${name}: ${value}`
                    }
                  >
                    {ownershipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Systems`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.legendGrid}>
              <div className={styles.legendItem}>
                <p className={styles.legendLabel}>In-House</p>
                <p className={`${styles.legendValue} ${styles.cyan}`}>
                  {inHousePercentage.toFixed(0)}%
                </p>
              </div>
              <div className={styles.legendItem}>
                <p className={styles.legendLabel}>Subcontracted</p>
                <p className={`${styles.legendValue} ${styles.orange}`}>
                  {subcontractedPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Systems Status</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Systems`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.statusGrid}>
              {statusData.map((status, index) => (
                <div key={index} className={styles.legendItem}>
                  <p className={styles.legendLabel}>{status.name}</p>
                  <p className={styles[`status${status.name.replace(' ', '')}`]}>
                    {status.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemsOverview;
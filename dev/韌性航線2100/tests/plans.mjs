// 各公司的「參考打法」：給自動測試用，也是 T1 autoplay 的驗收輸入。
export const PLANS = {
  X: { tileId: 'r2c0', bought: [['floodgate', 'supplierBackup', 'heatShift'], ['elevate', 'bcp'], []] },
  Y: { tileId: 'r3c1', bought: [['renewable', 'efficiency', 'icp'], ['floodgate', 'bcp'], []] },
  Z: { tileId: 'r3c1', bought: [[], [], []] },
  W: { tileId: 'r1c1', bought: [['floodgate', 'efficiency'], ['lowCarbonLine'], []] },
  V: { tileId: 'r3c1', bought: [['sourcingDiversify', 'floodgate'], ['heatShift', 'bcp'], []] }
};

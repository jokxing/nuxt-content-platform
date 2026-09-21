/** 脱敏数据期次种子，共 120 条。 */

export type DatasetPeriodSeed = {
  periodCode: string
  /** Asia/Hong_Kong calendar date YYYY-MM-DD; stored as that day 00:00 local -> UTC. */
  releasedDateHk: string
  value1: number
  value2: number
  value3: number
  value4: number
  value5: number
  value6: number
  extraValue: number
}

export const DATASET_PERIOD_SEEDS: readonly DatasetPeriodSeed[] = [
  { periodCode: '2026090', releasedDateHk: '2026-09-16', value1: 3, value2: 12, value3: 18, value4: 27, value5: 33, value6: 41, extraValue: 7 },
  { periodCode: '2026089', releasedDateHk: '2026-09-13', value1: 5, value2: 9, value3: 21, value4: 28, value5: 36, value6: 44, extraValue: 15 },
  { periodCode: '2026088', releasedDateHk: '2026-09-11', value1: 1, value2: 14, value3: 22, value4: 30, value5: 38, value6: 49, extraValue: 2 },
  { periodCode: '2026087', releasedDateHk: '2026-09-09', value1: 6, value2: 11, value3: 19, value4: 25, value5: 34, value6: 47, extraValue: 29 },
  { periodCode: '2026086', releasedDateHk: '2026-09-06', value1: 8, value2: 16, value3: 23, value4: 31, value5: 37, value6: 45, extraValue: 40 },
  { periodCode: '2026085', releasedDateHk: '2026-09-04', value1: 4, value2: 10, value3: 17, value4: 26, value5: 35, value6: 42, extraValue: 19 },
  { periodCode: '2026084', releasedDateHk: '2026-09-02', value1: 2, value2: 13, value3: 20, value4: 24, value5: 39, value6: 48, extraValue: 33 },
  { periodCode: '2026083', releasedDateHk: '2026-08-30', value1: 7, value2: 15, value3: 18, value4: 32, value5: 41, value6: 46, extraValue: 11 },
  { periodCode: '2026082', releasedDateHk: '2026-08-27', value1: 1, value2: 9, value3: 17, value4: 25, value5: 33, value6: 41, extraValue: 49 },
  { periodCode: '2026081', releasedDateHk: '2026-08-24', value1: 14, value2: 22, value3: 30, value4: 38, value5: 46, value6: 5, extraValue: 13 },
  { periodCode: '2026080', releasedDateHk: '2026-08-21', value1: 27, value2: 35, value3: 43, value4: 2, value5: 10, value6: 18, extraValue: 26 },
  { periodCode: '2026079', releasedDateHk: '2026-08-18', value1: 40, value2: 48, value3: 7, value4: 15, value5: 23, value6: 31, extraValue: 39 },
  { periodCode: '2026078', releasedDateHk: '2026-08-15', value1: 4, value2: 12, value3: 20, value4: 28, value5: 36, value6: 44, extraValue: 3 },
  { periodCode: '2026077', releasedDateHk: '2026-08-12', value1: 17, value2: 25, value3: 33, value4: 41, value5: 49, value6: 8, extraValue: 16 },
  { periodCode: '2026076', releasedDateHk: '2026-08-09', value1: 30, value2: 38, value3: 46, value4: 5, value5: 13, value6: 21, extraValue: 29 },
  { periodCode: '2026075', releasedDateHk: '2026-08-06', value1: 46, value2: 5, value3: 13, value4: 21, value5: 29, value6: 37, extraValue: 45 },
  { periodCode: '2026074', releasedDateHk: '2026-08-03', value1: 10, value2: 18, value3: 26, value4: 34, value5: 42, value6: 1, extraValue: 9 },
  { periodCode: '2026073', releasedDateHk: '2026-07-31', value1: 23, value2: 31, value3: 39, value4: 47, value5: 6, value6: 14, extraValue: 22 },
  { periodCode: '2026072', releasedDateHk: '2026-07-28', value1: 36, value2: 44, value3: 3, value4: 11, value5: 19, value6: 27, extraValue: 35 },
  { periodCode: '2026071', releasedDateHk: '2026-07-25', value1: 49, value2: 8, value3: 16, value4: 24, value5: 32, value6: 40, extraValue: 48 },
  { periodCode: '2026070', releasedDateHk: '2026-07-22', value1: 13, value2: 21, value3: 29, value4: 37, value5: 45, value6: 4, extraValue: 12 },
  { periodCode: '2026069', releasedDateHk: '2026-07-19', value1: 26, value2: 34, value3: 42, value4: 1, value5: 9, value6: 17, extraValue: 25 },
  { periodCode: '2026068', releasedDateHk: '2026-07-16', value1: 42, value2: 1, value3: 9, value4: 17, value5: 25, value6: 33, extraValue: 41 },
  { periodCode: '2026067', releasedDateHk: '2026-07-13', value1: 6, value2: 14, value3: 22, value4: 30, value5: 38, value6: 46, extraValue: 5 },
  { periodCode: '2026066', releasedDateHk: '2026-07-10', value1: 19, value2: 27, value3: 35, value4: 43, value5: 2, value6: 10, extraValue: 18 },
  { periodCode: '2026065', releasedDateHk: '2026-07-07', value1: 32, value2: 40, value3: 48, value4: 7, value5: 15, value6: 23, extraValue: 31 },
  { periodCode: '2026064', releasedDateHk: '2026-07-04', value1: 45, value2: 4, value3: 12, value4: 20, value5: 28, value6: 36, extraValue: 44 },
  { periodCode: '2026063', releasedDateHk: '2026-07-01', value1: 9, value2: 17, value3: 25, value4: 33, value5: 41, value6: 49, extraValue: 8 },
  { periodCode: '2026062', releasedDateHk: '2026-06-28', value1: 22, value2: 30, value3: 38, value4: 46, value5: 5, value6: 13, extraValue: 21 },
  { periodCode: '2026061', releasedDateHk: '2026-06-25', value1: 38, value2: 46, value3: 5, value4: 13, value5: 21, value6: 29, extraValue: 37 },
  { periodCode: '2026060', releasedDateHk: '2026-06-22', value1: 2, value2: 10, value3: 18, value4: 26, value5: 34, value6: 42, extraValue: 1 },
  { periodCode: '2026059', releasedDateHk: '2026-06-19', value1: 15, value2: 23, value3: 31, value4: 39, value5: 47, value6: 6, extraValue: 14 },
  { periodCode: '2026058', releasedDateHk: '2026-06-16', value1: 28, value2: 36, value3: 44, value4: 3, value5: 11, value6: 19, extraValue: 27 },
  { periodCode: '2026057', releasedDateHk: '2026-06-13', value1: 41, value2: 49, value3: 8, value4: 16, value5: 24, value6: 32, extraValue: 40 },
  { periodCode: '2026056', releasedDateHk: '2026-06-10', value1: 5, value2: 13, value3: 21, value4: 29, value5: 37, value6: 45, extraValue: 4 },
  { periodCode: '2026055', releasedDateHk: '2026-06-07', value1: 18, value2: 26, value3: 34, value4: 42, value5: 1, value6: 9, extraValue: 17 },
  { periodCode: '2026054', releasedDateHk: '2026-06-04', value1: 34, value2: 42, value3: 1, value4: 9, value5: 17, value6: 25, extraValue: 33 },
  { periodCode: '2026053', releasedDateHk: '2026-06-01', value1: 47, value2: 6, value3: 14, value4: 22, value5: 30, value6: 38, extraValue: 46 },
  { periodCode: '2026052', releasedDateHk: '2026-05-29', value1: 11, value2: 19, value3: 27, value4: 35, value5: 43, value6: 2, extraValue: 10 },
  { periodCode: '2026051', releasedDateHk: '2026-05-26', value1: 24, value2: 32, value3: 40, value4: 48, value5: 7, value6: 15, extraValue: 23 },
  { periodCode: '2026050', releasedDateHk: '2026-05-23', value1: 37, value2: 45, value3: 4, value4: 12, value5: 20, value6: 28, extraValue: 36 },
  { periodCode: '2026049', releasedDateHk: '2026-05-20', value1: 1, value2: 9, value3: 17, value4: 25, value5: 33, value6: 41, extraValue: 49 },
  { periodCode: '2026048', releasedDateHk: '2026-05-17', value1: 14, value2: 22, value3: 30, value4: 38, value5: 46, value6: 5, extraValue: 13 },
  { periodCode: '2026047', releasedDateHk: '2026-05-14', value1: 30, value2: 38, value3: 46, value4: 5, value5: 13, value6: 21, extraValue: 29 },
  { periodCode: '2026046', releasedDateHk: '2026-05-11', value1: 43, value2: 2, value3: 10, value4: 18, value5: 26, value6: 34, extraValue: 42 },
  { periodCode: '2026045', releasedDateHk: '2026-05-08', value1: 7, value2: 15, value3: 23, value4: 31, value5: 39, value6: 47, extraValue: 6 },
  { periodCode: '2026044', releasedDateHk: '2026-05-05', value1: 20, value2: 28, value3: 36, value4: 44, value5: 3, value6: 11, extraValue: 19 },
  { periodCode: '2026043', releasedDateHk: '2026-05-02', value1: 33, value2: 41, value3: 49, value4: 8, value5: 16, value6: 24, extraValue: 32 },
  { periodCode: '2026042', releasedDateHk: '2026-04-29', value1: 46, value2: 5, value3: 13, value4: 21, value5: 29, value6: 37, extraValue: 45 },
  { periodCode: '2026041', releasedDateHk: '2026-04-26', value1: 10, value2: 18, value3: 26, value4: 34, value5: 42, value6: 1, extraValue: 9 },
  { periodCode: '2026040', releasedDateHk: '2026-04-23', value1: 26, value2: 34, value3: 42, value4: 1, value5: 9, value6: 17, extraValue: 25 },
  { periodCode: '2026039', releasedDateHk: '2026-04-20', value1: 39, value2: 47, value3: 6, value4: 14, value5: 22, value6: 30, extraValue: 38 },
  { periodCode: '2026038', releasedDateHk: '2026-04-17', value1: 3, value2: 11, value3: 19, value4: 27, value5: 35, value6: 43, extraValue: 2 },
  { periodCode: '2026037', releasedDateHk: '2026-04-14', value1: 16, value2: 24, value3: 32, value4: 40, value5: 48, value6: 7, extraValue: 15 },
  { periodCode: '2026036', releasedDateHk: '2026-04-11', value1: 29, value2: 37, value3: 45, value4: 4, value5: 12, value6: 20, extraValue: 28 },
  { periodCode: '2026035', releasedDateHk: '2026-04-08', value1: 42, value2: 1, value3: 9, value4: 17, value5: 25, value6: 33, extraValue: 41 },
  { periodCode: '2026034', releasedDateHk: '2026-04-05', value1: 6, value2: 14, value3: 22, value4: 30, value5: 38, value6: 46, extraValue: 5 },
  { periodCode: '2026033', releasedDateHk: '2026-04-02', value1: 22, value2: 30, value3: 38, value4: 46, value5: 5, value6: 13, extraValue: 21 },
  { periodCode: '2026032', releasedDateHk: '2026-03-30', value1: 35, value2: 43, value3: 2, value4: 10, value5: 18, value6: 26, extraValue: 34 },
  { periodCode: '2026031', releasedDateHk: '2026-03-27', value1: 48, value2: 7, value3: 15, value4: 23, value5: 31, value6: 39, extraValue: 47 },
  { periodCode: '2026030', releasedDateHk: '2026-03-24', value1: 12, value2: 20, value3: 28, value4: 36, value5: 44, value6: 3, extraValue: 11 },
  { periodCode: '2026029', releasedDateHk: '2026-03-21', value1: 25, value2: 33, value3: 41, value4: 49, value5: 8, value6: 16, extraValue: 24 },
  { periodCode: '2026028', releasedDateHk: '2026-03-18', value1: 38, value2: 46, value3: 5, value4: 13, value5: 21, value6: 29, extraValue: 37 },
  { periodCode: '2026027', releasedDateHk: '2026-03-15', value1: 2, value2: 10, value3: 18, value4: 26, value5: 34, value6: 42, extraValue: 1 },
  { periodCode: '2026026', releasedDateHk: '2026-03-12', value1: 18, value2: 26, value3: 34, value4: 42, value5: 1, value6: 9, extraValue: 17 },
  { periodCode: '2026025', releasedDateHk: '2026-03-09', value1: 31, value2: 39, value3: 47, value4: 6, value5: 14, value6: 22, extraValue: 30 },
  { periodCode: '2026024', releasedDateHk: '2026-03-06', value1: 44, value2: 3, value3: 11, value4: 19, value5: 27, value6: 35, extraValue: 43 },
  { periodCode: '2026023', releasedDateHk: '2026-03-03', value1: 8, value2: 16, value3: 24, value4: 32, value5: 40, value6: 48, extraValue: 7 },
  { periodCode: '2026022', releasedDateHk: '2026-02-28', value1: 21, value2: 29, value3: 37, value4: 45, value5: 4, value6: 12, extraValue: 20 },
  { periodCode: '2026021', releasedDateHk: '2026-02-25', value1: 34, value2: 42, value3: 1, value4: 9, value5: 17, value6: 25, extraValue: 33 },
  { periodCode: '2026020', releasedDateHk: '2026-02-22', value1: 47, value2: 6, value3: 14, value4: 22, value5: 30, value6: 38, extraValue: 46 },
  { periodCode: '2026019', releasedDateHk: '2026-02-19', value1: 14, value2: 22, value3: 30, value4: 38, value5: 46, value6: 5, extraValue: 13 },
  { periodCode: '2026018', releasedDateHk: '2026-02-16', value1: 27, value2: 35, value3: 43, value4: 2, value5: 10, value6: 18, extraValue: 26 },
  { periodCode: '2026017', releasedDateHk: '2026-02-13', value1: 40, value2: 48, value3: 7, value4: 15, value5: 23, value6: 31, extraValue: 39 },
  { periodCode: '2026016', releasedDateHk: '2026-02-10', value1: 4, value2: 12, value3: 20, value4: 28, value5: 36, value6: 44, extraValue: 3 },
  { periodCode: '2026015', releasedDateHk: '2026-02-07', value1: 17, value2: 25, value3: 33, value4: 41, value5: 49, value6: 8, extraValue: 16 },
  { periodCode: '2026014', releasedDateHk: '2026-02-04', value1: 30, value2: 38, value3: 46, value4: 5, value5: 13, value6: 21, extraValue: 29 },
  { periodCode: '2026013', releasedDateHk: '2026-02-01', value1: 43, value2: 2, value3: 10, value4: 18, value5: 26, value6: 34, extraValue: 42 },
  { periodCode: '2026012', releasedDateHk: '2026-01-29', value1: 10, value2: 18, value3: 26, value4: 34, value5: 42, value6: 1, extraValue: 9 },
  { periodCode: '2026011', releasedDateHk: '2026-01-26', value1: 23, value2: 31, value3: 39, value4: 47, value5: 6, value6: 14, extraValue: 22 },
  { periodCode: '2026010', releasedDateHk: '2026-01-23', value1: 36, value2: 44, value3: 3, value4: 11, value5: 19, value6: 27, extraValue: 35 },
  { periodCode: '2026009', releasedDateHk: '2026-01-20', value1: 49, value2: 8, value3: 16, value4: 24, value5: 32, value6: 40, extraValue: 48 },
  { periodCode: '2026008', releasedDateHk: '2026-01-17', value1: 13, value2: 21, value3: 29, value4: 37, value5: 45, value6: 4, extraValue: 12 },
  { periodCode: '2026007', releasedDateHk: '2026-01-14', value1: 26, value2: 34, value3: 42, value4: 1, value5: 9, value6: 17, extraValue: 25 },
  { periodCode: '2026006', releasedDateHk: '2026-01-11', value1: 39, value2: 47, value3: 6, value4: 14, value5: 22, value6: 30, extraValue: 38 },
  { periodCode: '2026005', releasedDateHk: '2026-01-08', value1: 6, value2: 14, value3: 22, value4: 30, value5: 38, value6: 46, extraValue: 5 },
  { periodCode: '2026004', releasedDateHk: '2026-01-05', value1: 19, value2: 27, value3: 35, value4: 43, value5: 2, value6: 10, extraValue: 18 },
  { periodCode: '2026003', releasedDateHk: '2026-01-02', value1: 32, value2: 40, value3: 48, value4: 7, value5: 15, value6: 23, extraValue: 31 },
  { periodCode: '2026002', releasedDateHk: '2025-12-30', value1: 45, value2: 4, value3: 12, value4: 20, value5: 28, value6: 36, extraValue: 44 },
  { periodCode: '2026001', releasedDateHk: '2025-12-27', value1: 9, value2: 17, value3: 25, value4: 33, value5: 41, value6: 49, extraValue: 8 },
  { periodCode: '2026000', releasedDateHk: '2025-12-24', value1: 22, value2: 30, value3: 38, value4: 46, value5: 5, value6: 13, extraValue: 21 },
  { periodCode: '2025999', releasedDateHk: '2025-12-21', value1: 35, value2: 43, value3: 2, value4: 10, value5: 18, value6: 26, extraValue: 34 },
  { periodCode: '2025998', releasedDateHk: '2025-12-18', value1: 2, value2: 10, value3: 18, value4: 26, value5: 34, value6: 42, extraValue: 1 },
  { periodCode: '2025997', releasedDateHk: '2025-12-15', value1: 15, value2: 23, value3: 31, value4: 39, value5: 47, value6: 6, extraValue: 14 },
  { periodCode: '2025996', releasedDateHk: '2025-12-12', value1: 28, value2: 36, value3: 44, value4: 3, value5: 11, value6: 19, extraValue: 27 },
  { periodCode: '2025995', releasedDateHk: '2025-12-09', value1: 41, value2: 49, value3: 8, value4: 16, value5: 24, value6: 32, extraValue: 40 },
  { periodCode: '2025994', releasedDateHk: '2025-12-06', value1: 5, value2: 13, value3: 21, value4: 29, value5: 37, value6: 45, extraValue: 4 },
  { periodCode: '2025993', releasedDateHk: '2025-12-03', value1: 18, value2: 26, value3: 34, value4: 42, value5: 1, value6: 9, extraValue: 17 },
  { periodCode: '2025992', releasedDateHk: '2025-11-30', value1: 31, value2: 39, value3: 47, value4: 6, value5: 14, value6: 22, extraValue: 30 },
  { periodCode: '2025991', releasedDateHk: '2025-11-27', value1: 47, value2: 6, value3: 14, value4: 22, value5: 30, value6: 38, extraValue: 46 },
  { periodCode: '2025990', releasedDateHk: '2025-11-24', value1: 11, value2: 19, value3: 27, value4: 35, value5: 43, value6: 2, extraValue: 10 },
  { periodCode: '2025989', releasedDateHk: '2025-11-21', value1: 24, value2: 32, value3: 40, value4: 48, value5: 7, value6: 15, extraValue: 23 },
  { periodCode: '2025988', releasedDateHk: '2025-11-18', value1: 37, value2: 45, value3: 4, value4: 12, value5: 20, value6: 28, extraValue: 36 },
  { periodCode: '2025987', releasedDateHk: '2025-11-15', value1: 1, value2: 9, value3: 17, value4: 25, value5: 33, value6: 41, extraValue: 49 },
  { periodCode: '2025986', releasedDateHk: '2025-11-12', value1: 14, value2: 22, value3: 30, value4: 38, value5: 46, value6: 5, extraValue: 13 },
  { periodCode: '2025985', releasedDateHk: '2025-11-09', value1: 27, value2: 35, value3: 43, value4: 2, value5: 10, value6: 18, extraValue: 26 },
  { periodCode: '2025984', releasedDateHk: '2025-11-06', value1: 43, value2: 2, value3: 10, value4: 18, value5: 26, value6: 34, extraValue: 42 },
  { periodCode: '2025983', releasedDateHk: '2025-11-03', value1: 7, value2: 15, value3: 23, value4: 31, value5: 39, value6: 47, extraValue: 6 },
  { periodCode: '2025982', releasedDateHk: '2025-10-31', value1: 20, value2: 28, value3: 36, value4: 44, value5: 3, value6: 11, extraValue: 19 },
  { periodCode: '2025981', releasedDateHk: '2025-10-28', value1: 33, value2: 41, value3: 49, value4: 8, value5: 16, value6: 24, extraValue: 32 },
  { periodCode: '2025980', releasedDateHk: '2025-10-25', value1: 46, value2: 5, value3: 13, value4: 21, value5: 29, value6: 37, extraValue: 45 },
  { periodCode: '2025979', releasedDateHk: '2025-10-22', value1: 10, value2: 18, value3: 26, value4: 34, value5: 42, value6: 1, extraValue: 9 },
  { periodCode: '2025978', releasedDateHk: '2025-10-19', value1: 23, value2: 31, value3: 39, value4: 47, value5: 6, value6: 14, extraValue: 22 },
  { periodCode: '2025977', releasedDateHk: '2025-10-16', value1: 39, value2: 47, value3: 6, value4: 14, value5: 22, value6: 30, extraValue: 38 },
  { periodCode: '2025976', releasedDateHk: '2025-10-13', value1: 3, value2: 11, value3: 19, value4: 27, value5: 35, value6: 43, extraValue: 2 },
  { periodCode: '2025975', releasedDateHk: '2025-10-10', value1: 16, value2: 24, value3: 32, value4: 40, value5: 48, value6: 7, extraValue: 15 },
  { periodCode: '2025974', releasedDateHk: '2025-10-07', value1: 29, value2: 37, value3: 45, value4: 4, value5: 12, value6: 20, extraValue: 28 },
  { periodCode: '2025973', releasedDateHk: '2025-10-04', value1: 42, value2: 1, value3: 9, value4: 17, value5: 25, value6: 33, extraValue: 41 },
  { periodCode: '2025972', releasedDateHk: '2025-10-01', value1: 6, value2: 14, value3: 22, value4: 30, value5: 38, value6: 46, extraValue: 5 },
  { periodCode: '2025971', releasedDateHk: '2025-09-28', value1: 19, value2: 27, value3: 35, value4: 43, value5: 2, value6: 10, extraValue: 18 },
]

/** Interpret an Asia/Hong_Kong calendar date (no DST) as UTC Instant at 00:00 local. */
export function hongKongDateToUtc(dateYmd: string): Date {
  const match = /^(\d{4}-\d{2}-\d{2})$/.exec(dateYmd.trim())
  if (!match) {
    throw new Error(`Invalid Hong Kong date: ${dateYmd}`)
  }
  return new Date(`${match[1]}T00:00:00+08:00`)
}

export function assertDistinctValues(seed: DatasetPeriodSeed): void {
  const values = [seed.value1, seed.value2, seed.value3, seed.value4, seed.value5, seed.value6, seed.extraValue]
  for (const value of values) {
    if (!Number.isInteger(value) || value < 1 || value > 49) {
      throw new Error(`Out-of-range value in period ${seed.periodCode}`)
    }
  }
  if (new Set(values).size !== 7) {
    throw new Error(`Duplicate values in period ${seed.periodCode}`)
  }
}


import {
  useEffect, useState, useCallback, useMemo,
} from 'react';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import moment, { Moment } from 'moment';
import { reportApi, boardApi } from '@/api';
import useControlledDefaultValue from '@/hooks/useControlledDefaultValue';
import { AccumulationSearchProps } from './search';
import { AccumulationChartProps } from '.';
import { IAccumulationData } from './utils';

export interface AccumulationConfig {
  boardId?: string
  quickFilterIds?: string[]
  range?: [Moment, Moment]
}

function useAccumulationReport(config?: AccumulationConfig): [AccumulationSearchProps, AccumulationChartProps, Function] {
  const defaultDate = useMemo<[Moment, Moment]>(() => [moment().subtract(2, 'months'), moment()], []);
  const [quickFilterIds, setQuickFilterIds] = useControlledDefaultValue<string[]>(config?.quickFilterIds || []);
  const [data, setData] = useState<IAccumulationData[]>([]);
  const [boardId, setBoardId] = useState<string>(config?.boardId || '');
  const [columnIds, setColumnIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useControlledDefaultValue<[Moment, Moment]>(config?.range || defaultDate);
  const loadData = useCallback(async () => {
    if (boardId !== '' && columnIds.length > 0) {
      setLoading(true);
      const [startDate, endDate] = range;
      const burnDownData = await reportApi.loadCumulativeData({
        columnIds,
        endDate: `${endDate.format('YYYY-MM-DD')} 23:59:59`,
        quickFilterIds,
        startDate: startDate.format('YYYY-MM-DD 00:00:00'),
        boardId,
      });
      batchedUpdates(() => {
        setData(burnDownData);
        setLoading(false);
      });
    }
  }, [boardId, columnIds, quickFilterIds, range]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBoardChange = useCallback(async (newBoardId: string) => {
    const boardData = await boardApi.load(newBoardId, {});
    // @ts-ignore
    const newColumnIds = boardData.columnsData.columns.map((column) => column.columnId);
    batchedUpdates(() => {
      setBoardId(newBoardId);
      setColumnIds(newColumnIds);
    });
  }, []);
  useEffect(() => {
    if (config?.boardId) {
      handleBoardChange(config.boardId);
    }
  }, [config?.boardId, handleBoardChange]);
  const searchProps: AccumulationSearchProps = {
    range,
    onRangeChange: (value) => {
      setRange(value);
    },
    boardId,
    onBoardChange: handleBoardChange,
    quickFilterIds,
    onQuickSearchChange: (value) => {
      setQuickFilterIds(value);
    },
  };
  const props: AccumulationChartProps = {
    loading,
    data,
  };
  return [searchProps, props, loadData];
}

export default useAccumulationReport;

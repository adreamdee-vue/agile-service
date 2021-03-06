import React, { useCallback } from 'react';
import { Button } from 'choerodon-ui/pro';
import { observer } from 'mobx-react-lite';
import { ButtonColor } from 'choerodon-ui/pro/lib/button/enum';
import { DraggableProvided } from 'react-beautiful-dnd';
import styles from './index.less';
import {
  IReportBlock, IReportTextBlock, IReportChartBlock, IReportListBlock,
} from '../../store';
import TextBlock from './components/text-block';
import ChartBlock from './components/chart-block';
import ListBlock from './components/list-block';
import { useProjectReportContext } from '../../context';
import openAddModal from '../add-modal';

interface Props {
  data: IReportBlock
  index: number
  provided: DraggableProvided
}

const ReportBlock: React.FC<Props> = ({ data, index, provided }) => {
  const { title, type } = data;
  const { store } = useProjectReportContext();
  const renderBlock = useCallback(() => {
    switch (type) {
      case 'text': {
        return <TextBlock data={data as IReportTextBlock} />;
      }
      case 'chart': {
        return <ChartBlock data={data as IReportChartBlock} />;
      }
      case 'static_list': {
        return <ListBlock data={data as IReportListBlock} />;
      }
      case 'dynamic_list': {
        return <ListBlock data={data as IReportListBlock} />;
      }
      default: {
        return null;
      }
    }
  }, [data, type]);
  const handleDelete = useCallback(() => {
    store.removeBlock(index);
  }, [index, store]);
  const handleEdit = useCallback(() => {
    openAddModal({
      data,
      store,
      index,
    });
  }, [data, index, store]);
  return (
    <div className={styles.report_block}>
      <div
        className={styles.header}
        {...provided.dragHandleProps}
      >
        <span className={styles.title}>{title}</span>
        <div className={styles.operation}>
          <Button icon="edit-o" color={'blue' as ButtonColor} onClick={handleEdit}>编辑</Button>
          <Button icon="delete" color={'blue' as ButtonColor} onClick={handleDelete}>删除</Button>
        </div>
      </div>
      {renderBlock()}
    </div>
  );
};

export default observer(ReportBlock);

import React, { useMemo, useCallback, useImperativeHandle } from 'react';
import VersionBurnDown from '@/components/charts/version-burnDown';
import VersionBurnDownSearch from '@/components/charts/version-burnDown/search';
import useVersionBurnDownReport from '@/components/charts/version-burnDown/useVersionBurnDownReport';
import pic from '@/assets/image/emptyChart.svg';
import EmptyBlock from '@/components/EmptyBlock';
import to from '@/utils/to';
import LINK_URL from '@/constants/LINK_URL';
import { IReportChartBlock, VersionBurndownSearchVO } from '@/routes/project-report/report-page/store';
import { getProjectId } from '@/utils/common';
import { ChartRefProps } from '../..';

interface Props {
  innerRef: React.MutableRefObject<ChartRefProps>
  data?: IReportChartBlock
}
export const transformVersionBurndownSearch = (searchVO: VersionBurndownSearchVO): {
  versionId: string,
  checked: 'checked' | undefined,
} | undefined => {
  if (!searchVO) {
    return undefined;
  }
  return ({
    versionId: searchVO.versionId,
    checked: searchVO.calibrationSprint ? 'checked' : undefined,
  });
};

const EpicBurnDownComponent:React.FC<Props> = ({ innerRef, data }) => {
  const config = useMemo(() => transformVersionBurndownSearch(data?.chartSearchVO as VersionBurndownSearchVO), [data?.chartSearchVO]);
  const [searchProps, props] = useVersionBurnDownReport(config);
  const { versions, currentVersionId, checked } = searchProps;
  const handleSubmit = useCallback(async (): Promise<VersionBurndownSearchVO> => ({
    type: 'version',
    calibrationSprint: checked === 'checked',
    versionId: currentVersionId,
    projectId: getProjectId(),
  }),
  [checked, currentVersionId]);

  useImperativeHandle(innerRef, () => ({
    submit: handleSubmit,
  }), [handleSubmit]);

  return (
    <div>
      {
        versions && versions.length > 0 ? (
          <>
            <VersionBurnDownSearch {...searchProps} />
            <VersionBurnDown {...props} />
          </>
        ) : (
          <EmptyBlock
            textWidth="auto"
            pic={pic}
            title="当前项目无可用版本"
            des={(
              <div>
                <span>请在</span>
                <span
                  className="primary"
                  style={{ margin: '0 5px', cursor: 'pointer' }}
                  role="none"
                  onClick={() => {
                    to(LINK_URL.workListBacklog);
                  }}
                >
                  待办事项
                </span>
                <span>或</span>
                <span
                  className="primary"
                  style={{ margin: '0 5px', cursor: 'pointer' }}
                  role="none"
                  onClick={() => {
                    to(LINK_URL.workListIssue);
                  }}
                >
                  问题管理
                </span>
                <span>中创建一个版本</span>
              </div>
            )}
          />
        )
      }

    </div>
  );
};
export default EpicBurnDownComponent;

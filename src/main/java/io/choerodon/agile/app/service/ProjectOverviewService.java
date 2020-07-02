package io.choerodon.agile.app.service;

import io.choerodon.agile.api.vo.IssueCountVO;
import io.choerodon.agile.api.vo.SprintStatisticsVO;
import io.choerodon.agile.api.vo.UncompletedCountVO;

/**
 * @author jiaxu.cui@hand-china.com 2020/6/29 下午3:51
 */
public interface ProjectOverviewService {

    /**
     * 查询冲刺未完成情况
     * @param projectId 项目id
     * @param sprintId 冲刺id
     * @return 未完成情况统计
     */
    UncompletedCountVO selectUncompletedBySprint(Long projectId, Long sprintId);

    /**
     * 查询bug创建与解决情况
     * @param projectId 项目id
     * @param sprintId 冲刺id
     * @return bug情况统计
     */
    IssueCountVO selectIssueCountBysprint(Long projectId, Long sprintId);

    /**
     * 查看迭代统计
     * @param projectId 项目id
     * @param sprintId 冲刺id
     * @return bug情况统计
     */
    SprintStatisticsVO selectSprintStatistics(Long projectId, Long sprintId);
}
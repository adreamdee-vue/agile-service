package io.choerodon.agile.app.service;

import io.choerodon.agile.api.vo.StateMachineTransformUpdateVO;
import io.choerodon.agile.api.vo.StatusMachineTransformVO;
import io.choerodon.agile.api.vo.TransformVO;
import io.choerodon.agile.infra.dto.StatusMachineTransformDTO;

import java.util.List;
import java.util.Map;

/**
 * @author peng.jiang, dinghuang123@gmail.com
 */
public interface StateMachineTransformService {

    /**
     * 创建转换
     *
     * @param organizationId
     * @param transformVO
     * @return
     */
    StatusMachineTransformVO create(Long organizationId, Long stateMachineId, StatusMachineTransformVO transformVO);

    /**
     * 更新转换
     *
     * @param organizationId 组织id
     * @param transformId    转换id
     * @param transformVO   转换对象
     * @return 更新转换
     */
    StatusMachineTransformVO update(Long organizationId, Long stateMachineId, Long transformId, StatusMachineTransformVO transformVO);

    /**
     * 删除转换
     *
     * @param organizationId 组织id
     * @param transformId    节点id
     * @return
     */
    Boolean delete(Long organizationId, Long stateMachineId, Long transformId);

    /**
     * 获取初始转换
     *
     * @param stateMachineId
     * @return
     */
    StatusMachineTransformDTO getInitTransform(Long organizationId, Long stateMachineId);

    /**
     * 根据id获取转换
     *
     * @param organizationId
     * @param transformId
     * @return
     */
    StatusMachineTransformVO queryById(Long organizationId, Long transformId);

    /**
     * 获取当前状态拥有的转换列表，包括【全部】类型的转换
     *
     * @param organizationId
     * @param stateMachineId
     * @param statusId
     * @return
     */
    List<StatusMachineTransformDTO> queryListByStatusIdByDeploy(Long organizationId, Long stateMachineId, Long statusId);

    /**
     * 创建【全部转换到此状态】转换，所有节点均可转换到当前节点
     *
     * @param organizationId 组织id
     * @param endNodeId
     * @return
     */
    StatusMachineTransformVO createAllStatusTransform(Long organizationId, Long stateMachineId, Long endNodeId);

    /**
     * 删除【全部转换到此状态】转换
     *
     * @param organizationId
     * @param transformId
     * @return
     */
    Boolean deleteAllStatusTransform(Long organizationId, Long transformId);

    /**
     * 更新转换的条件策略
     *
     * @param organizationId
     * @param transformId
     * @param conditionStrategy
     * @return
     */
    Boolean updateConditionStrategy(Long organizationId, Long transformId, String conditionStrategy);

    /**
     * 校验名字是否重复
     *
     * @param organizationId
     * @param stateMachineId
     * @param name
     * @return
     */
    Boolean checkName(Long organizationId, Long stateMachineId, Long startNodeId, Long endNodeId, String name);

    /**
     * 根据状态机id列表查询出这些状态机每个状态对应的转换列表
     *
     * @param organizationId
     * @param stateMachineIds
     * @return
     */
    Map<Long, Map<Long, List<TransformVO>>> queryStatusTransformsMap(Long organizationId, List<Long> stateMachineIds);

    /**
     * 敏捷获取转换
     *
     * @param organizationId
     * @param transformId
     * @return
     */
    StatusMachineTransformDTO queryDeployTransformForAgile(Long organizationId, Long transformId);

    void createTransform(Long organizationId, Long stateMachineId, StateMachineTransformUpdateVO transformUpdateVO);

    void deleteTransformByNodeId(Long organizationId, Long stateMachineId, Long startNodeId, Long endNodeId);
}

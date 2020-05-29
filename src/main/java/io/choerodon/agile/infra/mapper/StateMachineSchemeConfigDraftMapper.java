package io.choerodon.agile.infra.mapper;

import io.choerodon.agile.infra.dto.StateMachineSchemeConfigDraftDTO;
import io.choerodon.mybatis.common.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Component;

/**
 * @author shinan.chen
 * @since 2018/11/19
 */
@Component
public interface StateMachineSchemeConfigDraftMapper extends BaseMapper<StateMachineSchemeConfigDraftDTO> {
    StateMachineSchemeConfigDraftDTO selectDefault(@Param("organizationId") Long organizationId, @Param("schemeId") Long schemeId);
}

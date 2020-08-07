package io.choerodon.agile.api.vo;

import java.util.Set;

/**
 * @author zhaotianxin
 * @date 2020-08-05 16:04
 */
public class StatusAndTransformVO {
    private Long id;

    private String name;

    private String code;

    private String type;

    private Set<Long> canTransformStatus;

    private Long stateMachineId;

    private Boolean defaultStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Set<Long> getCanTransformStatus() {
        return canTransformStatus;
    }

    public void setCanTransformStatus(Set<Long> canTransformStatus) {
        this.canTransformStatus = canTransformStatus;
    }

    public Long getStateMachineId() {
        return stateMachineId;
    }

    public void setStateMachineId(Long stateMachineId) {
        this.stateMachineId = stateMachineId;
    }

    public Boolean getDefaultStatus() {
        return defaultStatus;
    }

    public void setDefaultStatus(Boolean defaultStatus) {
        this.defaultStatus = defaultStatus;
    }
}

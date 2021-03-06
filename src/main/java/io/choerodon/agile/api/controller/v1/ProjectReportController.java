package io.choerodon.agile.api.controller.v1;

import javax.servlet.http.HttpServletResponse;

import io.choerodon.agile.api.vo.ProjectReportVO;
import io.choerodon.agile.app.service.ProjectReportService;
import io.choerodon.agile.infra.dto.ProjectReportDTO;
import io.choerodon.core.domain.Page;
import io.choerodon.core.iam.ResourceLevel;
import io.choerodon.mybatis.pagehelper.annotation.SortDefault;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;
import io.choerodon.mybatis.pagehelper.domain.Sort;
import io.choerodon.swagger.annotation.Permission;
import io.swagger.annotations.ApiOperation;
import org.hzero.core.util.Results;
import org.hzero.starter.keyencrypt.core.Encrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author jiaxu.cui@hand-china.com 2020/9/15 上午10:48
 */
@RestController
@RequestMapping(value = "/v1/projects/{project_id}/project_report")
public class ProjectReportController {

    @Autowired
    private ProjectReportService projectReportService;

    @ApiOperation(value = "项目报表列表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping
    public ResponseEntity<Page<ProjectReportDTO>> page(@PathVariable("project_id") Long projectId,
                                                       ProjectReportVO projectReport,
                                                       @SortDefault(value = "id", direction = Sort.Direction.DESC)
                                                       PageRequest pageRequest) {
        projectReport.setProjectId(projectId);
        return Results.success(projectReportService.page(projectReport, pageRequest));
    }

    @ApiOperation(value = "项目报表详情")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping("/{id}")
    public ResponseEntity<ProjectReportVO> detail(@PathVariable("project_id") Long projectId,
                                                    @PathVariable("id") @Encrypt Long id) {
        return Results.success(projectReportService.detail(projectId, id));
    }

    @ApiOperation(value = "创建项目报表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @PostMapping
    public ResponseEntity<Void> create(@PathVariable("project_id") Long projectId,
                                     @RequestBody ProjectReportVO projectReportDTO) {
        projectReportService.create(projectId, projectReportDTO);
        return Results.success();
    }

    @ApiOperation(value = "更新项目报表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable("project_id") Long projectId,
                                       @PathVariable("id") @Encrypt Long id,
                                       @RequestBody ProjectReportVO projectReportVO) {
        projectReportVO.setProjectId(projectId);
        projectReportVO.setId(id);
        projectReportService.update(projectId, projectReportVO);
        return Results.success();
    }

    @ApiOperation(value = "删除项目报表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("project_id") Long projectId,
                                       @PathVariable("id") @Encrypt Long id) {
        projectReportService.delete(projectId, id);
        return Results.success();
    }

    @ApiOperation(value = "发送项目报表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @PostMapping("/send/{id}")
    public ResponseEntity<Void> send(@PathVariable("project_id") Long projectId,
                                     @PathVariable("id") @Encrypt Long id,
                                     @RequestParam("file") MultipartFile multipartFile) {
        projectReportService.send(projectId, id, multipartFile);
        return Results.success();
    }
}
